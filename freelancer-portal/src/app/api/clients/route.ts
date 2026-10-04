import { NextResponse } from "next/server";

import Client from "@/models/Client";
import User from "@/models/User";
import Project from "@/models/Project";
import Invoice from "@/models/Invoice";
import { sum, withInvoiceAmounts, withProjectAmounts } from "@/lib/finance";
import { requireUser } from "@/lib/access";
import { cleanString, fail, isEmail, readJson, serverError } from "@/lib/api";

// =====================================================
// GET CLIENTS (freelancer's own client relationships)
// =====================================================
export async function GET() {
  try {
    const auth = await requireUser("freelancer");
    if (auth.response) return auth.response;

    const [clients, rawProjects, rawInvoices] = await Promise.all([
      Client.find({ freelancer: auth.user.id })
        .populate("user", "name email role")
        .sort({ createdAt: -1 })
        .lean(),
      Project.find({ freelancer: auth.user.id }).select("client status budget").lean(),
      Invoice.find({ freelancer: auth.user.id })
        .select("client amount dueDate status")
        .lean(),
    ]);

    const projects = await withProjectAmounts(rawProjects);
    const invoices = await withInvoiceAmounts(rawInvoices);

    // Per-client totals are calculated here, from the database,
    // so the page never has to work them out itself.
    const clientsWithStats = clients.map((client) => {
      const id = client._id.toString();
      const ownProjects = projects.filter(
        (project) => project.client.toString() === id
      );
      const ownInvoices = invoices.filter(
        (invoice) => invoice.client.toString() === id && invoice.status !== "Draft"
      );

      return {
        ...client,
        isConnected: Boolean(client.user),
        projectCount: ownProjects.length,
        activeProjectCount: ownProjects.filter(
          (project) => project.status === "In Progress"
        ).length,
        // Revenue = completed payments received from this client
        revenue: sum(ownProjects.map((project) => project.paidAmount)),
        // Project level: budget - completed payments of each project
        pendingAmount: sum(ownProjects.map((project) => project.pendingAmount)),
        // Unpaid balance of issued invoices only
        pendingInvoiceAmount: sum(ownInvoices.map((invoice) => invoice.pendingAmount)),
      };
    });

    return NextResponse.json({ success: true, clients: clientsWithStats });
  } catch (error) {
    return serverError("Get clients error", error, "Failed to load clients.");
  }
}

// =====================================================
// ADD CLIENT
// =====================================================
export async function POST(request: Request) {
  try {
    const auth = await requireUser("freelancer");
    if (auth.response) return auth.response;
    const user = auth.user;

    const body = await readJson(request);
    if (!body) return fail("Invalid request body.", 400);

    const name = cleanString(body.name, 100);
    const company = cleanString(body.company, 150);
    const email = cleanString(body.email, 254).toLowerCase();

    if (!name || !company || !email) {
      return fail("Name, company and email are required.", 400);
    }

    if (!isEmail(email)) {
      return fail("Please enter a valid client email address.", 400);
    }

    if (email === user.email.toLowerCase()) {
      return fail("You cannot add yourself as a client.", 400);
    }

    // One relationship per freelancer + client email. No duplicates.
    const existingClient = await Client.findOne({
      freelancer: user.id,
      email,
    });

    if (existingClient) {
      return fail("This client is already added.", 409);
    }

    // If the client has already registered, connect the relationship
    // to their login account straight away.
    const clientUser = await User.findOne({ email, role: "client" });

    let client;

    try {
      client = await Client.create({
        freelancer: user.id,
        user: clientUser ? clientUser._id : undefined,
        name,
        company,
        email,
      });
    } catch (error) {
      if ((error as { code?: number })?.code === 11000) {
        return fail("This client is already added.", 409);
      }
      throw error;
    }

    const populatedClient = await Client.findById(client._id)
      .populate("user", "name email role")
      .lean();

    return NextResponse.json(
      {
        success: true,
        message: clientUser
          ? "Client added and account connected successfully."
          : "Client added successfully. They can register using this email to connect their account.",
        client: populatedClient,
      },
      { status: 201 }
    );
  } catch (error) {
    return serverError("Create client error", error, "Failed to create client.");
  }
}
