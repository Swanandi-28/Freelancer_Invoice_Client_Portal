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

    if (user.role !== "freelancer") {
      return NextResponse.json(
        {
          success: false,
          message: "Only freelancers can access this dashboard.",
        },
        { status: 403 }
      );
    }

    await connectDB();

    const freelancerId = user.id;

    // Total clients
    const totalClients = await Client.countDocuments({
      freelancer: freelancerId,
    });

    // Active projects
    const activeProjects = await Project.countDocuments({
      freelancer: freelancerId,
      status: "In Progress",
    });

    // Pending invoices
    const pendingInvoices = await Invoice.find({
      freelancer: freelancerId,
      status: {
        $in: ["Pending", "Overdue"],
      },
    });

    const pendingInvoiceAmount = pendingInvoices.reduce(
      (total, invoice) => total + invoice.amount,
      0
    );

    // Total revenue from completed payments
    const completedPayments = await Payment.find({
      freelancer: freelancerId,
      status: "Completed",
    });

    const totalRevenue = completedPayments.reduce(
      (total, payment) => total + payment.amount,
      0
    );

    // Recent projects
    const recentProjects = await Project.find({
      freelancer: freelancerId,
    })
      .populate("client", "name company")
      .sort({ createdAt: -1 })
      .limit(5);

    // Recent invoices
    const recentInvoices = await Invoice.find({
      freelancer: freelancerId,
    })
      .populate("client", "name company")
      .populate("project", "name")
      .sort({ createdAt: -1 })
      .limit(5);

    return NextResponse.json({
      success: true,

      stats: {
        totalClients,
        activeProjects,
        pendingInvoiceAmount,
        totalRevenue,
      },

      recentProjects,
      recentInvoices,
    });
  } catch (error) {
    console.error("Freelancer dashboard error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load dashboard data.",
      },
      { status: 500 }
    );
  }
}