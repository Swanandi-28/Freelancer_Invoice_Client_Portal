import { NextResponse } from "next/server";

import Client from "@/models/Client";
import Project from "@/models/Project";
import Invoice from "@/models/Invoice";
import Payment from "@/models/Payment";
import { requireUser } from "@/lib/access";
import { sum, withInvoiceAmounts, withProjectAmounts } from "@/lib/finance";
import { serverError } from "@/lib/api";

export async function GET() {
  try {
    const auth = await requireUser("freelancer");
    if (auth.response) return auth.response;

    const freelancerId = auth.user.id;

    const [totalClients, activeProjects, rawInvoices, completedPayments, rawRecentProjects, projectBudgets] =
      await Promise.all([
        Client.countDocuments({ freelancer: freelancerId }),
        Project.countDocuments({ freelancer: freelancerId, status: "In Progress" }),
        Invoice.find({ freelancer: freelancerId })
          .populate("client", "name company")
          .populate("project", "name")
          .sort({ createdAt: -1 })
          .lean(),
        Payment.find({ freelancer: freelancerId, status: "Completed" })
          .select("amount")
          .lean(),
        Project.find({ freelancer: freelancerId })
          .populate("client", "name company")
          .sort({ createdAt: -1 })
          .limit(5)
          .lean(),
        Project.find({ freelancer: freelancerId }).select("budget").lean(),
      ]);

    const invoices = await withInvoiceAmounts(rawInvoices);
    const recentProjects = await withProjectAmounts(rawRecentProjects);

    // Pending Project Amount = sum over projects of
    // (project budget - completed payments of that project).
    const pendingProjectAmount = sum(
      (await withProjectAmounts(projectBudgets)).map((project) => project.pendingAmount)
    );

    // Pending Invoice Amount = sum of (invoice amount - completed payments
    // for that invoice) over all active (non-draft) invoices.
    const pendingInvoiceAmount = sum(
      invoices
        .filter((invoice) => invoice.status !== "Draft")
        .map((invoice) => invoice.pendingAmount)
    );

    // Total Revenue = all completed payments received.
    const totalRevenue = sum(completedPayments.map((payment) => payment.amount));

    return NextResponse.json({
      success: true,
      user: { name: auth.user.name, email: auth.user.email },
      stats: {
        totalClients,
        activeProjects,
        pendingInvoiceAmount,
        pendingProjectAmount,
        totalRevenue,
      },
      recentProjects,
      recentInvoices: invoices.slice(0, 5),
    });
  } catch (error) {
    return serverError(
      "Freelancer dashboard error",
      error,
      "Failed to load dashboard data."
    );
  }
}
