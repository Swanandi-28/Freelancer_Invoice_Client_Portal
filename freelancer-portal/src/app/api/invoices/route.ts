import { NextResponse } from "next/server";

import Invoice from "@/models/Invoice";
import Client from "@/models/Client";
import Project from "@/models/Project";
import { requireUser, resolveScope } from "@/lib/access";
import { withInvoiceAmounts, withProjectTotals } from "@/lib/finance";
import {
  cleanString,
  fail,
  isObjectId,
  parseAmount,
  parseDate,
  readJson,
  serverError,
} from "@/lib/api";

// =====================================================
// GET INVOICES
// Every invoice is returned with:
//   amount, paidAmount, pendingAmount, status
// calculated on the server from the Completed payments
// of THAT invoice.
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

    const filter: Record<string, unknown> = { ...scoped.scope.filter };

    // Clients never see invoices that are still drafts.
    if (auth.user.role === "client") {
      filter.status = { $ne: "Draft" };
    }

    const invoices = await Invoice.find(filter)
      .populate("client", "name company email")
      .populate("project", "name budget")
      .populate("freelancer", "name email")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      // Invoice totals + the totals of the project each invoice belongs to.
      invoices: await withProjectTotals(await withInvoiceAmounts(invoices)),
    });
  } catch (error) {
    return serverError("Get invoices error", error, "Failed to fetch invoices.");
  }
}

// =====================================================
// CREATE INVOICE (freelancer only)
// Validates: freelancer -> client -> project
// =====================================================
export async function POST(request: Request) {
  try {
    const auth = await requireUser("freelancer");
    if (auth.response) return auth.response;
    const user = auth.user;

    const body = await readJson(request);
    if (!body) return fail("Invalid request body.", 400);

    const { clientId, projectId } = body;
    // Optional. When empty, the next INV-00N for this freelancer is generated.
    let invoiceNumber = cleanString(body.invoiceNumber, 40);
    const status = body.status || "Pending";

    if (
      !clientId ||
      !projectId ||
      body.amount === undefined ||
      body.amount === "" ||
      !body.issueDate ||
      !body.dueDate
    ) {
      return fail("All required invoice fields must be provided.", 400);
    }

    if (!isObjectId(clientId) || !isObjectId(projectId)) {
      return fail("Invalid client or project id.", 400);
    }

    if (
      invoiceNumber &&
      !/^[A-Za-z0-9][A-Za-z0-9\-_/#.]{0,29}$/.test(invoiceNumber)
    ) {
      return fail(
        "Invoice number may only contain letters, numbers, '-', '_', '/', '#', '.' (max 30 characters).",
        400
      );
    }

    const invoiceAmount = parseAmount(body.amount);

    if (invoiceAmount === null) {
      return fail("Invoice amount must be greater than 0.", 400);
    }

    const issueDate = parseDate(body.issueDate);
    const dueDate = parseDate(body.dueDate);

    if (!issueDate || !dueDate) {
      return fail("Issue date and due date must be valid dates.", 400);
    }

    if (dueDate.getTime() < issueDate.getTime()) {
      return fail("Due date cannot be before the issue date.", 400);
    }

    // A new invoice can only start as Draft or Pending.
    // Paid / Overdue are calculated from payments and the due date.
    if (status !== "Draft" && status !== "Pending") {
      return fail("A new invoice must be Draft or Pending.", 400);
    }

    // Client must belong to this freelancer.
    const client = await Client.findOne({ _id: clientId, freelancer: user.id });

    if (!client) {
      return fail("Client not found.", 404);
    }

    // Project must belong to this freelancer AND this client.
    const project = await Project.findOne({
      _id: projectId,
      freelancer: user.id,
      client: client._id,
    });

    if (!project) {
      return fail("This project does not belong to the selected client.", 400);
    }

    const invoiceData = {
      freelancer: user.id,
      client: client._id,
      project: project._id,
      amount: invoiceAmount,
      issueDate,
      dueDate,
      status: status as "Draft" | "Pending",
    };

    let invoice;

    if (invoiceNumber) {
      // ---------- Number chosen by the freelancer ----------
      const existingInvoice = await Invoice.findOne({
        freelancer: user.id,
        invoiceNumber,
      });

      if (existingInvoice) {
        return fail("Invoice number already exists.", 409);
      }

      try {
        invoice = await Invoice.create({ ...invoiceData, invoiceNumber });
      } catch (error) {
        if ((error as { code?: number })?.code === 11000) {
          return fail("Invoice number already exists.", 409);
        }
        throw error;
      }
    } else {
      // ---------- Automatic number: INV-001, INV-002, ... per freelancer ----------
      const existingNumbers = await Invoice.find({ freelancer: user.id })
        .select("invoiceNumber")
        .lean();

      let next =
        existingNumbers.reduce((highest, item) => {
          const match = /^INV-(\d+)$/i.exec(item.invoiceNumber || "");
          return match ? Math.max(highest, Number(match[1])) : highest;
        }, 0) + 1;

      for (let attempt = 0; attempt < 5 && !invoice; attempt += 1) {
        invoiceNumber = `INV-${String(next).padStart(3, "0")}`;

        try {
          invoice = await Invoice.create({ ...invoiceData, invoiceNumber });
        } catch (error) {
          // Number taken by a simultaneous request: try the next one.
          if ((error as { code?: number })?.code !== 11000) throw error;
          next += 1;
        }
      }

      if (!invoice) {
        return fail("Could not generate an invoice number. Please try again.", 409);
      }
    }

    const populated = await Invoice.findById(invoice._id)
      .populate("client", "name company email")
      .populate("project", "name budget")
      .lean();

    const [invoiceWithAmounts] = await withInvoiceAmounts(
      populated ? [populated] : []
    );

    return NextResponse.json(
      {
        success: true,
        message: "Invoice created successfully.",
        invoice: invoiceWithAmounts,
      },
      { status: 201 }
    );
  } catch (error) {
    return serverError("Create invoice error", error, "Failed to create invoice.");
  }
}
