import { NextResponse } from "next/server";

import User from "@/models/User";
import Client from "@/models/Client";
import Project from "@/models/Project";
import Invoice from "@/models/Invoice";
import { requireUser } from "@/lib/access";
import { serverError } from "@/lib/api";

/*
  GET /api/admin/freelancers   (administrators only)
  Every freelancer with the number of clients, projects and invoices.
*/
export async function GET() {
  try {
    const auth = await requireUser("admin");
    if (auth.response) return auth.response;

    const [freelancers, clients, projects, invoices] = await Promise.all([
      User.find({ role: "freelancer" })
        .select("name email createdAt")
        .sort({ createdAt: -1 })
        .lean(),
      Client.find().select("freelancer").lean(),
      Project.find().select("freelancer").lean(),
      Invoice.find().select("freelancer").lean(),
    ]);

    const countBy = (items: { freelancer: { toString(): string } }[]) => {
      const counts = new Map<string, number>();
      for (const item of items) {
        const key = item.freelancer.toString();
        counts.set(key, (counts.get(key) || 0) + 1);
      }
      return counts;
    };

    const clientCounts = countBy(clients);
    const projectCounts = countBy(projects);
    const invoiceCounts = countBy(invoices);

    return NextResponse.json({
      success: true,
      freelancers: freelancers.map((freelancer) => {
        const id = freelancer._id.toString();
        return {
          _id: id,
          name: freelancer.name,
          email: freelancer.email,
          createdAt: freelancer.createdAt,
          clientCount: clientCounts.get(id) || 0,
          projectCount: projectCounts.get(id) || 0,
          invoiceCount: invoiceCounts.get(id) || 0,
        };
      }),
    });
  } catch (error) {
    return serverError("Admin freelancers error", error, "Failed to load freelancers.");
  }
}
