import { NextResponse } from "next/server";

import Project from "@/models/Project";
import Invoice from "@/models/Invoice";
import Payment from "@/models/Payment";
import { getClientRelationships, requireUser } from "@/lib/access";
import {
  sum,
  withInvoiceAmounts,
  withProjectAmounts,
  withProjectTotals,
} from "@/lib/finance";
import { serverError } from "@/lib/api";

type Named = { _id?: { toString(): string }; name?: string; email?: string } | null;

const nameOf = (value: unknown, fallback: string) =>
  (value as Named)?.name || fallback;

export async function GET() {
  try {
    const auth = await requireUser("client");
    if (auth.response) return auth.response;
    const user = auth.user;

    /*
      Authenticated client user
        -> Client relationships (user = me, auto-linked by email)
        -> projects / invoices / payments of those relationships
    */
    const relationships = await getClientRelationships(user);
    const clientIds = relationships.map((relationship) => relationship._id);

    const [rawProjects, rawInvoices, payments] = await Promise.all([
      Project.find({ client: { $in: clientIds } })
        .populate("freelancer", "name email")
        .sort({ createdAt: -1 })
        .lean(),
      Invoice.find({ client: { $in: clientIds }, status: { $ne: "Draft" } })
        .populate("freelancer", "name email")
        .populate("project", "name")
        .sort({ createdAt: -1 })
        .lean(),
      Payment.find({ client: { $in: clientIds } })
        .populate("freelancer", "name email")
        .populate("project", "name")
        .populate("invoice", "invoiceNumber")
        .sort({ paymentDate: -1, createdAt: -1 })
        .lean(),
    ]);

    const projects = await withProjectAmounts(rawProjects);
    const invoices = await withProjectTotals(await withInvoiceAmounts(rawInvoices));

    const completedPayments = payments.filter(
      (payment) => payment.status === "Completed"
    );

    // ---------- My Freelancers: one card per relationship ----------
    const freelancers = relationships.map((relationship) => {
      const relationshipId = relationship._id.toString();
      const freelancer = relationship.freelancer as unknown as Named;

      const ownProjects = projects.filter(
        (project) => project.client.toString() === relationshipId
      );
      const ownInvoices = invoices.filter(
        (invoice) => invoice.client.toString() === relationshipId
      );

      return {
        id: relationshipId,
        freelancer: freelancer
          ? {
              id: freelancer._id?.toString(),
              name: freelancer.name || "Freelancer",
              email: freelancer.email || "",
            }
          : null,
        company: relationship.company,
        clientName: relationship.name,
        email: relationship.email,
        projectCount: ownProjects.length,
        projects: ownProjects.map((project) => project.name),
        budget: sum(ownProjects.map((project) => project.budget)),
        // Project level: budget - completed payments of each project.
        pendingAmount: sum(ownProjects.map((project) => project.pendingAmount)),
        paidAmount: sum(ownProjects.map((project) => project.paidAmount)),
        pendingInvoiceAmount: sum(ownInvoices.map((invoice) => invoice.pendingAmount)),
      };
    });

    return NextResponse.json({
      success: true,
      client: { name: user.name, email: user.email },
      stats: {
        totalFreelancers: new Set(
          freelancers.map((item) => item.freelancer?.id || item.id)
        ).size,
        activeProjects: projects.filter(
          (project) => project.status === "In Progress"
        ).length,
        totalBudget: sum(projects.map((project) => project.budget)),
        // Sum over projects of (project budget - completed payments of that project)
        pendingAmount: sum(projects.map((project) => project.pendingAmount)),
        // Sum of (invoice amount - completed payments for that invoice)
        pendingInvoices: sum(invoices.map((invoice) => invoice.pendingAmount)),
        totalPaid: sum(completedPayments.map((payment) => payment.amount)),
      },
      freelancers,
      recentProjects: projects.slice(0, 5).map((project) => ({
        id: project._id.toString(),
        name: project.name,
        description: project.description,
        budget: project.budget,
        paidAmount: project.paidAmount,
        pendingAmount: project.pendingAmount,
        deadline: project.deadline,
        status: project.status,
        freelancer: nameOf(project.freelancer, "Freelancer"),
      })),
      recentInvoices: invoices.slice(0, 5).map((invoice) => ({
        id: invoice._id.toString(),
        invoiceNumber: invoice.invoiceNumber,
        amount: invoice.amount,
        paidAmount: invoice.paidAmount,
        pendingAmount: invoice.pendingAmount,
        projectBudget: invoice.projectBudget,
        projectPaidAmount: invoice.projectPaidAmount,
        projectPendingAmount: invoice.projectPendingAmount,
        issueDate: invoice.issueDate,
        dueDate: invoice.dueDate,
        status: invoice.status,
        project: nameOf(invoice.project, "Project"),
        freelancer: nameOf(invoice.freelancer, "Freelancer"),
      })),
      recentPayments: payments.slice(0, 5).map((payment) => ({
        id: payment._id.toString(),
        amount: Number(payment.amount || 0),
        paymentDate: payment.paymentDate,
        paymentMethod: payment.paymentMethod,
        status: payment.status,
        project: nameOf(payment.project, "Project"),
        freelancer: nameOf(payment.freelancer, "Freelancer"),
        invoice:
          (payment.invoice as unknown as { invoiceNumber?: string } | null)
            ?.invoiceNumber || "Invoice",
      })),
    });
  } catch (error) {
    return serverError(
      "Client dashboard error",
      error,
      "Failed to load client dashboard."
    );
  }
}
