import mongoose from "mongoose";

import Invoice from "@/models/Invoice";
import Payment from "@/models/Payment";
import Project from "@/models/Project";
import { roundMoney } from "@/lib/api";

/*
  =====================================================
  THE ONE PLACE WHERE INVOICE MONEY IS CALCULATED
  =====================================================

  For each invoice:

    invoiceAmount = invoice.amount

    paidAmount    = SUM(payment.amount)
                    WHERE payment.invoice == invoice._id
                    AND   payment.status  == "Completed"

    pendingAmount = MAX(invoiceAmount - paidAmount, 0)

  Every API (invoices, payments, dashboards, reports, workspace)
  uses these functions, so the numbers can never disagree, and the
  frontend never has to calculate them itself.
*/

export type InvoiceStatus = "Draft" | "Pending" | "Paid" | "Overdue";

type IdLike = mongoose.Types.ObjectId | string;

/** paidAmount per invoice id (Completed payments only). */
export async function getPaidByInvoice(
  invoiceIds: IdLike[]
): Promise<Map<string, number>> {
  const paid = new Map<string, number>();

  if (invoiceIds.length === 0) return paid;

  const payments = await Payment.find({
    invoice: { $in: invoiceIds },
    status: "Completed",
  })
    .select("invoice amount")
    .lean();

  for (const payment of payments) {
    const key = payment.invoice.toString();
    paid.set(key, roundMoney((paid.get(key) || 0) + Number(payment.amount || 0)));
  }

  return paid;
}

export function calculateInvoice(
  invoice: { amount: number; dueDate?: Date | string; status?: string },
  paidAmountInput: number
): {
  amount: number;
  paidAmount: number;
  pendingAmount: number;
  status: InvoiceStatus;
} {
  const amount = roundMoney(invoice.amount);
  const paidAmount = roundMoney(paidAmountInput);
  const pendingAmount = Math.max(roundMoney(amount - paidAmount), 0);

  /*
    Draft   : created but not active yet, nothing paid
    Paid    : pending amount = 0
    Overdue : due date has passed AND pending amount > 0
    Pending : has a remaining amount
  */
  let status: InvoiceStatus;

  if (pendingAmount === 0 && amount > 0) {
    status = "Paid";
  } else if (invoice.status === "Draft" && paidAmount === 0) {
    status = "Draft";
  } else {
    const endOfDueDay = invoice.dueDate ? new Date(invoice.dueDate) : null;
    if (endOfDueDay) endOfDueDay.setHours(23, 59, 59, 999);

    status =
      endOfDueDay && endOfDueDay.getTime() < Date.now() ? "Overdue" : "Pending";
  }

  return { amount, paidAmount, pendingAmount, status };
}

/*
  Adds amount / paidAmount / pendingAmount / status to lean invoices.
  If the stored status is out of date (old data, or a due date that has
  now passed) it is corrected in MongoDB as well.
*/
export async function withInvoiceAmounts<
  T extends {
    _id: IdLike;
    amount: number;
    dueDate?: Date | string;
    status?: string;
  }
>(invoices: T[]) {
  const paidByInvoice = await getPaidByInvoice(
    invoices.map((invoice) => invoice._id)
  );

  const statusFixes: { id: IdLike; status: InvoiceStatus }[] = [];

  const result = invoices.map((invoice) => {
    const calculated = calculateInvoice(
      invoice,
      paidByInvoice.get(invoice._id.toString()) || 0
    );

    if (calculated.status !== invoice.status) {
      statusFixes.push({ id: invoice._id, status: calculated.status });
    }

    return { ...invoice, ...calculated };
  });

  await Promise.all(
    statusFixes.map((fix) =>
      Invoice.updateOne({ _id: fix.id }, { $set: { status: fix.status } })
    )
  );

  return result;
}

export function sum(values: number[]): number {
  return roundMoney(values.reduce((total, value) => total + (Number(value) || 0), 0));
}

/*
  Adds invoiceAmount / paidAmount / pendingAmount to lean payments whose
  `invoice` field is populated. The totals are for the WHOLE invoice
  (all completed payments of that invoice), not just this payment.
*/
export async function withPaymentAmounts<
  T extends {
    amount: number;
    invoice?: unknown;
  }
>(payments: T[]) {
  type PopulatedInvoice = {
    _id: IdLike;
    amount: number;
    dueDate?: Date | string;
    status?: string;
  };

  const getInvoice = (payment: T): PopulatedInvoice | null => {
    const invoice = payment.invoice as PopulatedInvoice | null | undefined;
    return invoice && typeof invoice === "object" && "amount" in invoice
      ? invoice
      : null;
  };

  const invoiceIds = [
    ...new Set(
      payments
        .map((payment) => getInvoice(payment)?._id.toString())
        .filter((id): id is string => Boolean(id))
    ),
  ];

  const paidByInvoice = await getPaidByInvoice(invoiceIds);

  return payments.map((payment) => {
    const invoice = getInvoice(payment);

    if (!invoice) {
      return {
        ...payment,
        amount: roundMoney(payment.amount),
        invoiceAmount: 0,
        paidAmount: 0,
        pendingAmount: 0,
      };
    }

    const calculated = calculateInvoice(
      invoice,
      paidByInvoice.get(invoice._id.toString()) || 0
    );

    return {
      ...payment,
      amount: roundMoney(payment.amount),
      invoice: { ...invoice, status: calculated.status },
      invoiceAmount: calculated.amount,
      paidAmount: calculated.paidAmount,
      pendingAmount: calculated.pendingAmount,
    };
  });
}

/*
  =====================================================
  PROJECT-LEVEL MONEY (project budget vs payments)
  =====================================================

  The project's BUDGET is the total the client owes for that project.

    projectBudget  = project.budget

    projectPaid    = SUM(payment.amount)
                     WHERE payment.project == project._id
                     AND   payment.status  == "Completed"

    projectPending = MAX(projectBudget - projectPaid, 0)

  This is separate from the invoice-level numbers above: an invoice can
  be fully Paid while its project still has budget left to pay.
*/

/** Completed payments per project id. */
export async function getPaidByProject(
  projectIds: IdLike[]
): Promise<Map<string, number>> {
  const paid = new Map<string, number>();

  if (projectIds.length === 0) return paid;

  const payments = await Payment.find({
    project: { $in: projectIds },
    status: "Completed",
  })
    .select("project amount")
    .lean();

  for (const payment of payments) {
    const key = payment.project.toString();
    paid.set(key, roundMoney((paid.get(key) || 0) + Number(payment.amount || 0)));
  }

  return paid;
}

export function calculateProject(budgetInput: number, paidAmountInput: number) {
  const budget = roundMoney(budgetInput);
  const paidAmount = roundMoney(paidAmountInput);
  const pendingAmount = Math.max(roundMoney(budget - paidAmount), 0);

  return { budget, paidAmount, pendingAmount };
}

/** Adds paidAmount / pendingAmount (budget-based) to lean projects. */
export async function withProjectAmounts<
  T extends { _id: IdLike; budget: number }
>(projects: T[]) {
  const paidByProject = await getPaidByProject(
    projects.map((project) => project._id)
  );

  return projects.map((project) => ({
    ...project,
    ...calculateProject(
      project.budget,
      paidByProject.get(project._id.toString()) || 0
    ),
  }));
}

/*
  Adds the totals of the PROJECT an invoice / payment belongs to:
    projectBudget, projectPaidAmount, projectPendingAmount
  `project` may be an id or a populated document.
*/
export async function withProjectTotals<T extends { project?: unknown }>(
  items: T[]
) {
  const projectIdOf = (item: T): string | null => {
    const project = item.project as
      | { _id?: IdLike }
      | IdLike
      | null
      | undefined;
    if (!project) return null;
    if (typeof project === "object" && "_id" in project && project._id) {
      return project._id.toString();
    }
    return project.toString();
  };

  const projectIds = [
    ...new Set(items.map(projectIdOf).filter((id): id is string => Boolean(id))),
  ];

  const [projects, paidByProject] = await Promise.all([
    projectIds.length
      ? Project.find({ _id: { $in: projectIds } }).select("budget").lean()
      : Promise.resolve([]),
    getPaidByProject(projectIds),
  ]);

  const budgets = new Map(
    projects.map((project) => [project._id.toString(), Number(project.budget || 0)])
  );

  return items.map((item) => {
    const id = projectIdOf(item);
    const totals = calculateProject(
      id ? budgets.get(id) || 0 : 0,
      id ? paidByProject.get(id) || 0 : 0
    );

    return {
      ...item,
      projectBudget: totals.budget,
      projectPaidAmount: totals.paidAmount,
      projectPendingAmount: totals.pendingAmount,
    };
  });
}
