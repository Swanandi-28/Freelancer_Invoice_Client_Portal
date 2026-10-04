import { NextResponse } from "next/server";

import Project from "@/models/Project";
import Invoice from "@/models/Invoice";
import Payment from "@/models/Payment";
import FileModel from "@/models/File";
import Message from "@/models/Message";
import { getClientRelationships, requireUser } from "@/lib/access";
import {
  sum,
  withInvoiceAmounts,
  withPaymentAmounts,
  withProjectAmounts,
  withProjectTotals,
} from "@/lib/finance";
import { fail, isObjectId, serverError } from "@/lib/api";

/*
  GET /api/client/workspace?freelancerId=...   (or ?clientId=<relationship id>)

  A workspace = logged-in client + ONE freelancer relationship.

  The id in the URL is only a selector. The server looks the
  relationship up among the relationships that belong to the
  authenticated client, so changing the id to someone else's
  freelancer / relationship returns 403.
*/
export async function GET(request: Request) {
  try {
    const auth = await requireUser("client");
    if (auth.response) return auth.response;

    const params = new URL(request.url).searchParams;
    const freelancerId = params.get("freelancerId") || params.get("freelancer");
    const clientId = params.get("clientId");

    if (!freelancerId && !clientId) {
      return fail("Freelancer ID is required.", 400);
    }

    if (
      (freelancerId && !isObjectId(freelancerId)) ||
      (clientId && !isObjectId(clientId))
    ) {
      return fail("Invalid workspace id.", 400);
    }

    const relationships = await getClientRelationships(auth.user);

    const relationship = relationships.find((item) => {
      const freelancer = item.freelancer as unknown as {
        _id?: { toString(): string };
      } | null;

      if (clientId && item._id.toString() !== clientId) return false;
      if (freelancerId && freelancer?._id?.toString() !== freelancerId) return false;
      return true;
    });

    if (!relationship || !relationship.freelancer) {
      return fail("You do not have access to this workspace.", 403);
    }

    const freelancer = relationship.freelancer as unknown as {
      _id: { toString(): string };
      name: string;
      email: string;
    };

    // Everything below is limited to this exact relationship.
    const scope = {
      client: relationship._id,
      freelancer: freelancer._id.toString(),
    };

    const [rawProjects, rawInvoices, rawPayments, files, unreadMessages] =
      await Promise.all([
        Project.find(scope).sort({ createdAt: -1 }).lean(),
        Invoice.find({ ...scope, status: { $ne: "Draft" } })
          .populate("project", "name")
          .sort({ createdAt: -1 })
          .lean(),
        Payment.find(scope)
          .populate("project", "name")
          .populate("invoice", "invoiceNumber amount status dueDate")
          .sort({ paymentDate: -1, createdAt: -1 })
          .lean(),
        FileModel.find(scope)
          .populate("project", "name")
          .sort({ createdAt: -1 })
          .lean(),
        Message.countDocuments({ ...scope, senderRole: "freelancer", read: false }),
      ]);

    // Project level: pending = budget - completed payments of that project.
    const projects = await withProjectAmounts(rawProjects);
    // Invoice level (amount / paid / status) + the totals of its project.
    const invoices = await withProjectTotals(await withInvoiceAmounts(rawInvoices));
    const payments = await withProjectTotals(await withPaymentAmounts(rawPayments));

    return NextResponse.json({
      success: true,
      freelancer: {
        _id: freelancer._id.toString(),
        name: freelancer.name,
        email: freelancer.email,
      },
      client: {
        id: relationship._id.toString(),
        name: relationship.name,
        company: relationship.company,
        email: relationship.email,
      },
      stats: {
        totalProjects: projects.length,
        activeProjects: projects.filter((project) => project.status === "In Progress").length,
        totalInvoiced: sum(invoices.map((invoice) => invoice.amount)),
        totalBudget: sum(projects.map((project) => project.budget)),
        // Completed payments across this workspace's projects.
        totalPaid: sum(projects.map((project) => project.paidAmount)),
        // SUM over projects of (budget - completed payments of that project).
        pendingAmount: sum(projects.map((project) => project.pendingAmount)),
        // Unpaid balance of issued invoices only (invoice amount - its payments).
        pendingInvoiceAmount: sum(invoices.map((invoice) => invoice.pendingAmount)),
        unreadMessages,
      },
      projects,
      invoices,
      payments,
      files: files.map((file) => ({
        ...file,
        downloadUrl: `/api/files/${file._id.toString()}/download`,
      })),
    });
  } catch (error) {
    return serverError("Client workspace error", error, "Failed to load workspace.");
  }
}
