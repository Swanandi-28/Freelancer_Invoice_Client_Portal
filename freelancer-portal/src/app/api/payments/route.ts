import { NextResponse } from "next/server";

import Payment from "@/models/Payment";
import Invoice from "@/models/Invoice";
import Client from "@/models/Client";
import Project from "@/models/Project";
import { requireUser, resolveScope } from "@/lib/access";
import {
  calculateInvoice,
  calculateProject,
  getPaidByInvoice,
  getPaidByProject,
  withPaymentAmounts,
  withProjectTotals,
} from "@/lib/finance";
import {
  fail,
  isObjectId,
  parseAmount,
  parseDate,
  readJson,
  serverError,
} from "@/lib/api";

const PAYMENT_METHODS = ["Bank Transfer", "UPI", "Cash", "Card", "Other"] as const;
const PAYMENT_STATUSES = ["Pending", "Completed"] as const;

type PaymentMethod = (typeof PAYMENT_METHODS)[number];
type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

const formatINR = (amount: number) => `₹${amount.toLocaleString("en-IN")}`;

// =====================================================
// GET PAYMENTS
// Every payment is returned with the totals of ITS invoice:
//   invoiceAmount, paidAmount, pendingAmount
// =====================================================
export async function GET(request: Request) {
  try {
    const auth = await requireUser();
    if (auth.response) return auth.response;

    const scoped = await resolveScope(
      auth.user,
      new URL(request.url).searchParams
    );
    if (scoped.response) return scoped.response;

    const payments = await Payment.find(scoped.scope.filter)
      .populate("client", "name company email")
      .populate("project", "name budget")
      .populate("invoice", "invoiceNumber amount status dueDate")
      .populate("freelancer", "name email")
      .sort({ paymentDate: -1, createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      payments: await withProjectTotals(await withPaymentAmounts(payments)),
    });
  } catch (error) {
    return serverError("Get payments error", error, "Failed to load payments.");
  }
}

// =====================================================
// RECORD PAYMENT (freelancer only)
//
// The freelancer, client and project are taken from the
// INVOICE in the database - never from the browser - so a
// payment always satisfies:
//   payment.invoice -> project -> client -> freelancer
// =====================================================
export async function POST(request: Request) {
  try {
    const auth = await requireUser("freelancer");
    if (auth.response) return auth.response;
    const user = auth.user;

    const body = await readJson(request);
    if (!body) return fail("Invalid request body.", 400);

    const { invoiceId, clientId, projectId } = body;
    const paymentMethod = body.paymentMethod || "Other";
    const status = body.status || "Completed";

    if (!invoiceId || body.amount === undefined || body.amount === "" || !body.paymentDate) {
      return fail("Invoice, amount and payment date are required.", 400);
    }

    if (!isObjectId(invoiceId)) {
      return fail("Invalid invoice id.", 400);
    }

    const paymentAmount = parseAmount(body.amount);

    if (paymentAmount === null) {
      return fail("Payment amount must be greater than 0.", 400);
    }

    const paymentDate = parseDate(body.paymentDate);

    if (!paymentDate) {
      return fail("Payment date must be a valid date.", 400);
    }

    if (!PAYMENT_METHODS.includes(paymentMethod as PaymentMethod)) {
      return fail("Invalid payment method.", 400);
    }

    if (!PAYMENT_STATUSES.includes(status as PaymentStatus)) {
      return fail("Invalid payment status.", 400);
    }

    // ---------- Invoice must belong to this freelancer ----------
    const invoice = await Invoice.findOne({
      _id: invoiceId,
      freelancer: user.id,
    });

    if (!invoice) {
      return fail("Invoice not found.", 404);
    }

    // ---------- Validate the full relationship chain ----------
    const [client, project] = await Promise.all([
      Client.findOne({ _id: invoice.client, freelancer: user.id }).select("_id"),
      Project.findOne({
        _id: invoice.project,
        client: invoice.client,
        freelancer: user.id,
      }).select("_id name budget"),
    ]);

    if (!client || !project) {
      return fail(
        "This invoice is not linked to a valid client and project.",
        400
      );
    }

    // If the browser also sent a client/project, they must match the invoice.
    if (clientId && clientId !== invoice.client.toString()) {
      return fail("This invoice does not belong to the selected client.", 400);
    }

    if (projectId && projectId !== invoice.project.toString()) {
      return fail("This invoice does not belong to the selected project.", 400);
    }

    // ---------- Pending = invoice amount - completed payments of THIS invoice ----------
    const paidBefore =
      (await getPaidByInvoice([invoice._id])).get(invoice._id.toString()) || 0;

    const before = calculateInvoice(invoice, paidBefore);

    if (before.pendingAmount <= 0) {
      return fail("This invoice is already fully paid.", 400);
    }

    // ---------- Prevent overpayment ----------
    if (paymentAmount > before.pendingAmount) {
      return fail(
        `Payment cannot exceed the pending amount of ${formatINR(before.pendingAmount)}.`,
        400
      );
    }

    // =================================================
    // PROJECT-LEVEL VALIDATION (separate from the invoice check above)
    //   projectPending = project.budget - completed payments of THIS project
    // Total completed payments of a project can never exceed its budget.
    // =================================================
    const projectPaidBefore =
      (await getPaidByProject([project._id])).get(project._id.toString()) || 0;

    const projectBefore = calculateProject(project.budget, projectPaidBefore);

    if (projectBefore.pendingAmount <= 0) {
      return fail(
        `The project "${project.name}" is already fully paid (budget ${formatINR(projectBefore.budget)}).`,
        400
      );
    }

    if (paymentAmount > projectBefore.pendingAmount) {
      return fail(
        `Payment cannot exceed the project's remaining budget of ${formatINR(projectBefore.pendingAmount)}.`,
        400
      );
    }

    const payment = await Payment.create({
      freelancer: invoice.freelancer,
      client: invoice.client,
      project: invoice.project,
      invoice: invoice._id,
      amount: paymentAmount,
      paymentDate,
      paymentMethod: paymentMethod as PaymentMethod,
      status: status as PaymentStatus,
    });

    // ---------- Recalculate from ALL completed payments ----------
    let paidAfter =
      (await getPaidByInvoice([invoice._id])).get(invoice._id.toString()) || 0;

    // Safety net: if two payments were recorded at the same moment and
    // together exceed the invoice, undo this one.
    if (paidAfter > invoice.amount + 0.001) {
      await Payment.deleteOne({ _id: payment._id });
      paidAfter =
        (await getPaidByInvoice([invoice._id])).get(invoice._id.toString()) || 0;
      const current = calculateInvoice(invoice, paidAfter);
      return fail(
        `Payment cannot exceed the pending amount of ${formatINR(current.pendingAmount)}.`,
        409
      );
    }

    // Same safety net at project level (two simultaneous payments on
    // different invoices of the same project).
    const projectPaidAfter =
      (await getPaidByProject([project._id])).get(project._id.toString()) || 0;

    if (projectPaidAfter > project.budget + 0.001) {
      await Payment.deleteOne({ _id: payment._id });
      const remaining = calculateProject(
        project.budget,
        (await getPaidByProject([project._id])).get(project._id.toString()) || 0
      );
      return fail(
        `Payment cannot exceed the project's remaining budget of ${formatINR(remaining.pendingAmount)}.`,
        409
      );
    }

    const projectAfter = calculateProject(project.budget, projectPaidAfter);

    // A draft becomes active once a payment exists against it.
    const after = calculateInvoice(
      { amount: invoice.amount, dueDate: invoice.dueDate, status: "Pending" },
      paidAfter
    );

    // Paid only when pending is 0; otherwise Pending / Overdue.
    invoice.status = after.status;
    await invoice.save();

    const populatedPayment = await Payment.findById(payment._id)
      .populate("client", "name company email")
      .populate("project", "name budget")
      .populate("invoice", "invoiceNumber amount status dueDate")
      .lean();

    return NextResponse.json(
      {
        success: true,
        message:
          projectAfter.pendingAmount === 0
            ? "Payment recorded. The project is now fully paid."
            : after.pendingAmount === 0
              ? `Payment recorded. Invoice is fully paid; ${formatINR(projectAfter.pendingAmount)} of the project budget is still pending.`
              : `Payment recorded. ${formatINR(after.pendingAmount)} still pending on this invoice (${formatINR(projectAfter.pendingAmount)} on the project).`,
        payment: {
          ...populatedPayment,
          invoiceAmount: after.amount,
          paidAmount: after.paidAmount,
          pendingAmount: after.pendingAmount,
          projectBudget: projectAfter.budget,
          projectPaidAmount: projectAfter.paidAmount,
          projectPendingAmount: projectAfter.pendingAmount,
        },
        invoice: {
          _id: invoice._id,
          invoiceNumber: invoice.invoiceNumber,
          ...after,
        },
        project: {
          _id: project._id,
          name: project.name,
          ...projectAfter,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return serverError("Create payment error", error, "Failed to record payment.");
  }
}
