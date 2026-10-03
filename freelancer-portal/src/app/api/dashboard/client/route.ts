import { NextResponse } from "next/server";

import connectDB from "@/lib/mongodb";
import Client from "@/models/Client";
import Project from "@/models/Project";
import Invoice from "@/models/Invoice";
import Payment from "@/models/Payment";
import { getAuthenticatedUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized.",
        },
        { status: 401 }
      );
    }

    if (user.role !== "client") {
      return NextResponse.json(
        {
          success: false,
          message: "Only clients can access this dashboard.",
        },
        { status: 403 }
      );
    }

    await connectDB();

    /*
      Find every Client relationship belonging
      to the currently logged-in client user.
    */
    const clientRelationships = await Client.find({
      user: user.id,
    })
      .populate("freelancer", "name email")
      .sort({ createdAt: -1 })
      .lean();

    if (clientRelationships.length === 0) {
      return NextResponse.json({
        success: true,
        client: {
          name: user.name,
          email: user.email,
        },

        stats: {
          totalFreelancers: 0,
          activeProjects: 0,
          pendingInvoices: 0,
          totalPaid: 0,
        },

        freelancers: [],
        recentProjects: [],
        recentInvoices: [],
        recentPayments: [],
      });
    }

    // IDs of all Client relationship records
    const clientIds = clientRelationships.map(
      (client) => client._id
    );

    // -----------------------------
    // PROJECTS
    // -----------------------------

    const projects = await Project.find({
      client: { $in: clientIds },
    })
      .populate("freelancer", "name email")
      .sort({ createdAt: -1 })
      .lean();

    const activeProjects = projects.filter(
      (project) => project.status === "In Progress"
    ).length;

    // -----------------------------
    // INVOICES
    // -----------------------------

    const invoices = await Invoice.find({
      client: { $in: clientIds },
    })
      .populate("freelancer", "name email")
      .populate("project", "name")
      .sort({ createdAt: -1 })
      .lean();

    const pendingInvoices = invoices.filter(
      (invoice) =>
        invoice.status === "Pending" ||
        invoice.status === "Overdue"
    );

    const pendingInvoiceAmount = pendingInvoices.reduce(
      (total, invoice) =>
        total + Number(invoice.amount || 0),
      0
    );

    // -----------------------------
    // PAYMENTS
    // -----------------------------

    const payments = await Payment.find({
      client: { $in: clientIds },
    })
      .populate("freelancer", "name email")
      .populate("project", "name")
      .populate("invoice", "invoiceNumber")
      .sort({ paymentDate: -1 })
      .lean();

    const completedPayments = payments.filter(
      (payment) => payment.status === "Completed"
    );

    const totalPaid = completedPayments.reduce(
      (total, payment) =>
        total + Number(payment.amount || 0),
      0
    );

    // -----------------------------
    // FREELANCERS
    // -----------------------------

    const freelancers = clientRelationships.map(
      (client) => ({
        id: client._id.toString(),

        freelancer:
          typeof client.freelancer === "object" &&
          client.freelancer !== null
            ? {
                id: (
                  client.freelancer as any
                )._id?.toString(),

                name:
                  (client.freelancer as any)
                    .name || "Freelancer",

                email:
                  (client.freelancer as any)
                    .email || "",
              }
            : null,

        company: client.company,

        clientName: client.name,

        email: client.email,
      })
    );

    // -----------------------------
    // RECENT PROJECTS
    // -----------------------------

    const recentProjects = projects
      .slice(0, 5)
      .map((project) => ({
        id: project._id.toString(),

        name: project.name,

        description: project.description,

        budget: Number(project.budget || 0),

        deadline: project.deadline,

        status: project.status,

        freelancer:
          typeof project.freelancer === "object" &&
          project.freelancer !== null
            ? (project.freelancer as any).name ||
              "Freelancer"
            : "Freelancer",
      }));

    // -----------------------------
    // RECENT INVOICES
    // -----------------------------

    const recentInvoices = invoices
      .slice(0, 5)
      .map((invoice) => ({
        id: invoice._id.toString(),

        invoiceNumber:
          invoice.invoiceNumber,

        amount: Number(invoice.amount || 0),

        issueDate: invoice.issueDate,

        dueDate: invoice.dueDate,

        status: invoice.status,

        project:
          typeof invoice.project === "object" &&
          invoice.project !== null
            ? (invoice.project as any).name ||
              "Project"
            : "Project",

        freelancer:
          typeof invoice.freelancer === "object" &&
          invoice.freelancer !== null
            ? (invoice.freelancer as any).name ||
              "Freelancer"
            : "Freelancer",
      }));

    // -----------------------------
    // RECENT PAYMENTS
    // -----------------------------

    const recentPayments = payments
      .slice(0, 5)
      .map((payment) => ({
        id: payment._id.toString(),

        amount: Number(payment.amount || 0),

        paymentDate: payment.paymentDate,

        paymentMethod:
          payment.paymentMethod,

        status: payment.status,

        project:
          typeof payment.project === "object" &&
          payment.project !== null
            ? (payment.project as any).name ||
              "Project"
            : "Project",

        invoice:
          typeof payment.invoice === "object" &&
          payment.invoice !== null
            ? (
                payment.invoice as any
              ).invoiceNumber || "Invoice"
            : "Invoice",
      }));

    // -----------------------------
    // RESPONSE
    // -----------------------------

    return NextResponse.json({
      success: true,

      client: {
        name: user.name,
        email: user.email,
      },

      stats: {
        totalFreelancers:
          clientRelationships.length,

        activeProjects,

        pendingInvoices:
          pendingInvoiceAmount,

        totalPaid,
      },

      freelancers,

      recentProjects,

      recentInvoices,

      recentPayments,
    });
  } catch (error) {
    console.error(
      "Client dashboard error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to load client dashboard.",
      },
      { status: 500 }
    );
  }
}