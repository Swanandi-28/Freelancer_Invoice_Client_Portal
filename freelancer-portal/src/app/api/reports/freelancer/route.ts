import { NextResponse } from "next/server";

import Client from "@/models/Client";
import Project from "@/models/Project";
import Invoice from "@/models/Invoice";
import Payment from "@/models/Payment";
import { requireUser } from "@/lib/access";
import { sum, withInvoiceAmounts, withProjectAmounts } from "@/lib/finance";
import { roundMoney, serverError } from "@/lib/api";

/*
  DEFINITIONS USED IN THIS REPORT

  Project Budget          total agreed value of projects (Project.budget)
  Invoiced Amount         sum of Invoice.amount for active (non-draft) invoices
  Paid Amount             completed payments recorded against those invoices
  Pending Invoice Amount  for each invoice: amount - completed payments of
                          THAT invoice, summed (never below 0)
  Revenue                 all completed payments received
  Uninvoiced Budget       project budget that has not been invoiced yet
  Pending Project Amount  for each project: budget - completed payments of
                          THAT project, summed (never below 0)
*/
export async function GET() {
  try {
    const auth = await requireUser("freelancer");
    if (auth.response) return auth.response;

    const freelancerId = auth.user.id;

    const [totalClients, rawProjects, rawInvoices, payments] = await Promise.all([
      Client.countDocuments({ freelancer: freelancerId }),
      Project.find({ freelancer: freelancerId })
        .populate("client", "name company")
        .sort({ createdAt: -1 })
        .lean(),
      Invoice.find({ freelancer: freelancerId }).sort({ createdAt: -1 }).lean(),
      Payment.find({ freelancer: freelancerId }).sort({ paymentDate: -1 }).lean(),
    ]);

    const projects = await withProjectAmounts(rawProjects);
    const invoices = await withInvoiceAmounts(rawInvoices);
    const activeInvoices = invoices.filter((invoice) => invoice.status !== "Draft");

    const completedPayments = payments.filter(
      (payment) => payment.status === "Completed"
    );

    // ---------- Summary ----------
    const totalProjectBudget = sum(projects.map((project) => project.budget));
    const totalInvoicedAmount = sum(activeInvoices.map((invoice) => invoice.amount));
    const paidInvoiceAmount = sum(activeInvoices.map((invoice) => invoice.paidAmount));
    const pendingAmount = sum(activeInvoices.map((invoice) => invoice.pendingAmount));
    const overdueAmount = sum(
      activeInvoices
        .filter((invoice) => invoice.status === "Overdue")
        .map((invoice) => invoice.pendingAmount)
    );
    const totalRevenue = sum(completedPayments.map((payment) => payment.amount));
    const pendingPaymentAmount = sum(
      payments
        .filter((payment) => payment.status === "Pending")
        .map((payment) => payment.amount)
    );
    const uninvoicedBudget = Math.max(
      roundMoney(totalProjectBudget - totalInvoicedAmount),
      0
    );

    // ---------- Monthly revenue (last 6 months with payments) ----------
    const monthly = new Map<string, { label: string; revenue: number }>();

    for (const payment of completedPayments) {
      const date = new Date(payment.paymentDate);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const label = `${date.toLocaleString("en-US", { month: "short" })} ${date.getFullYear()}`;
      const entry = monthly.get(key) || { label, revenue: 0 };
      entry.revenue = roundMoney(entry.revenue + Number(payment.amount || 0));
      monthly.set(key, entry);
    }

    const monthlyRevenue = [...monthly.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([, entry]) => ({ month: entry.label, revenue: entry.revenue }));

    // ---------- Project performance (per project, from its own invoices) ----------
    const projectPerformance = projects.map((project) => {
      const projectInvoices = activeInvoices.filter(
        (invoice) => invoice.project.toString() === project._id.toString()
      );
      const client = project.client as unknown as {
        name?: string;
        company?: string;
      } | null;

      return {
        id: project._id.toString(),
        name: project.name,
        budget: project.budget,
        status: project.status,
        client: client?.company || client?.name || "Client",
        invoiced: sum(projectInvoices.map((invoice) => invoice.amount)),
        // Project level: completed payments of this project, and
        // pending = budget - those payments.
        paid: project.paidAmount,
        pending: project.pendingAmount,
        // Invoice level: unpaid balance of this project's issued invoices.
        invoicePending: sum(projectInvoices.map((invoice) => invoice.pendingAmount)),
      };
    });

    // ---------- Invoice status breakdown ----------
    const invoiceBreakdown = { Draft: 0, Pending: 0, Paid: 0, Overdue: 0 };
    for (const invoice of invoices) {
      invoiceBreakdown[invoice.status] += 1;
    }

    // ---------- Payment methods ----------
    const methods = new Map<string, number>();
    for (const payment of completedPayments) {
      const method = payment.paymentMethod || "Other";
      methods.set(method, roundMoney((methods.get(method) || 0) + Number(payment.amount || 0)));
    }

    return NextResponse.json({
      success: true,
      summary: {
        totalClients,
        totalProjects: projects.length,
        activeProjects: projects.filter((project) => project.status === "In Progress").length,
        completedProjects: projects.filter((project) => project.status === "Completed").length,
        totalProjectBudget,
        uninvoicedBudget,
        totalInvoices: invoices.length,
        totalInvoicedAmount,
        paidInvoiceAmount,
        pendingAmount,
        // Sum over projects of (budget - completed payments of that project)
        pendingProjectAmount: sum(projects.map((project) => project.pendingAmount)),
        overdueAmount,
        totalRevenue,
        pendingPaymentAmount,
      },
      monthlyRevenue,
      projectPerformance,
      invoiceBreakdown,
      paymentMethods: [...methods.entries()].map(([method, amount]) => ({
        method,
        amount,
      })),
    });
  } catch (error) {
    return serverError("Freelancer reports error", error, "Failed to load reports.");
  }
}
