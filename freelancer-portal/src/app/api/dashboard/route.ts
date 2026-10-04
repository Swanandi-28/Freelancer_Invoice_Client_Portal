import { NextResponse } from "next/server";

import Client from "@/models/Client";
import Invoice from "@/models/Invoice";
import Payment from "@/models/Payment";
import Project from "@/models/Project";
import { requireUser, resolveScope } from "@/lib/access";
import { withInvoiceAmounts, withPaymentAmounts } from "@/lib/finance";
import { serverError } from "@/lib/api";

/*
  Generic dashboard data for the logged-in user (either role).
  The role-specific routes /api/dashboard/freelancer and
  /api/dashboard/client are what the pages use.
*/
export async function GET() {
  try {
    const auth = await requireUser();
    if (auth.response) return auth.response;
    const user = auth.user;

    const scoped = await resolveScope(user);
    if (scoped.response) return scoped.response;
    const filter = scoped.scope.filter;

    const [clients, projects, invoices, payments] = await Promise.all([
      user.role === "freelancer"
        ? Client.find(filter).sort({ createdAt: -1 }).lean()
        : Promise.resolve([]),
      Project.find(filter)
        .populate("client", "name company email")
        .populate("freelancer", "name email")
        .sort({ createdAt: -1 })
        .lean(),
      Invoice.find(
        user.role === "client" ? { ...filter, status: { $ne: "Draft" } } : filter
      )
        .populate("client", "name company email")
        .populate("project", "name")
        .populate("freelancer", "name email")
        .sort({ createdAt: -1 })
        .lean(),
      Payment.find(filter)
        .populate("client", "name company email")
        .populate("project", "name")
        .populate("invoice", "invoiceNumber amount status dueDate")
        .populate("freelancer", "name email")
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    return NextResponse.json({
      success: true,
      user,
      clients,
      projects,
      invoices: await withInvoiceAmounts(invoices),
      payments: await withPaymentAmounts(payments),
    });
  } catch (error) {
    return serverError("Get dashboard data error", error, "Failed to fetch dashboard data.");
  }
}
