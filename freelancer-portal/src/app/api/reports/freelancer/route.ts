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
          message: "Only freelancers can access reports.",
        },
        { status: 403 }
      );
    }

    await connectDB();

    const freelancerId = user.id;

    // -----------------------------
    // CLIENTS
    // -----------------------------

    const totalClients = await Client.countDocuments({
      freelancer: freelancerId,
    });

    // -----------------------------
    // PROJECTS
    // -----------------------------

    const projects = await Project.find({
      freelancer: freelancerId,
    })
      .populate("client", "name company")
      .sort({ createdAt: -1 })
      .lean();

    const totalProjects = projects.length;

    const activeProjects = projects.filter(
      (project) => project.status === "In Progress"
    ).length;

    const completedProjects = projects.filter(
      (project) => project.status === "Completed"
    ).length;

    // Total value of all projects
    const totalProjectBudget = projects.reduce(
      (total, project) =>
        total + Number(project.budget || 0),
      0
    );

    // -----------------------------
    // INVOICES
    // -----------------------------

    const invoices = await Invoice.find({
      freelancer: freelancerId,
    })
      .populate("client", "name company")
      .populate("project", "name")
      .sort({ createdAt: -1 })
      .lean();

    const totalInvoicedAmount = invoices.reduce(
      (total, invoice) =>
        total + Number(invoice.amount || 0),
      0
    );

    const paidInvoices = invoices.filter(
      (invoice) => invoice.status === "Paid"
    );

    const paidInvoiceAmount = paidInvoices.reduce(
      (total, invoice) =>
        total + Number(invoice.amount || 0),
      0
    );

    // -----------------------------
    // PAYMENTS
    // -----------------------------

    const payments = await Payment.find({
      freelancer: freelancerId,
    })
      .populate("client", "name company")
      .populate("project", "name")
      .populate("invoice", "invoiceNumber")
      .sort({ paymentDate: -1 })
      .lean();

    const completedPayments = payments.filter(
      (payment) => payment.status === "Completed"
    );

    const totalRevenue = completedPayments.reduce(
      (total, payment) =>
        total + Number(payment.amount || 0),
      0
    );

    const pendingPayments = payments.filter(
      (payment) => payment.status === "Pending"
    );

    const pendingPaymentAmount = pendingPayments.reduce(
      (total, payment) =>
        total + Number(payment.amount || 0),
      0
    );

    // -----------------------------
    // REMAINING PROJECT BALANCE
    // -----------------------------

    /*
      Example:

      Project Budget = ₹50,000
      Completed Payments = ₹20,000

      Remaining Balance = ₹50,000 - ₹20,000
                        = ₹30,000
    */

    const pendingAmount = Math.max(
      totalProjectBudget - totalRevenue,
      0
    );

    // -----------------------------
    // MONTHLY REVENUE
    // -----------------------------

    const monthlyRevenueMap: Record<string, number> = {};

    completedPayments.forEach((payment) => {
      const date = new Date(payment.paymentDate);

      const month = date.toLocaleString("en-US", {
        month: "short",
      });

      const year = date.getFullYear();

      const key = `${month} ${year}`;

      if (!monthlyRevenueMap[key]) {
        monthlyRevenueMap[key] = 0;
      }

      monthlyRevenueMap[key] += Number(
        payment.amount || 0
      );
    });

    const monthlyRevenue = Object.entries(
      monthlyRevenueMap
    )
      .map(([month, revenue]) => ({
        month,
        revenue,
      }))
      .sort((a, b) => {
        const dateA = new Date(`1 ${a.month}`);
        const dateB = new Date(`1 ${b.month}`);

        return dateA.getTime() - dateB.getTime();
      })
      .slice(-6);

    // -----------------------------
    // PROJECT PERFORMANCE
    // -----------------------------

    const projectPerformance = projects.map(
      (project) => ({
        id: project._id.toString(),

        name: project.name,

        budget: Number(project.budget || 0),

        status: project.status,

        client:
          typeof project.client === "object" &&
          project.client !== null
            ? (project.client as any).company ||
              (project.client as any).name ||
              "Client"
            : "Client",
      })
    );

    // -----------------------------
    // INVOICE STATUS BREAKDOWN
    // -----------------------------

    const invoiceBreakdown = {
      Draft: invoices.filter(
        (invoice) => invoice.status === "Draft"
      ).length,

      Pending: invoices.filter(
        (invoice) => invoice.status === "Pending"
      ).length,

      Paid: invoices.filter(
        (invoice) => invoice.status === "Paid"
      ).length,

      Overdue: invoices.filter(
        (invoice) => invoice.status === "Overdue"
      ).length,
    };

    // -----------------------------
    // PAYMENT METHOD BREAKDOWN
    // -----------------------------

    const paymentMethodMap: Record<string, number> = {};

    completedPayments.forEach((payment) => {
      const method =
        payment.paymentMethod || "Other";

      if (!paymentMethodMap[method]) {
        paymentMethodMap[method] = 0;
      }

      paymentMethodMap[method] += Number(
        payment.amount || 0
      );
    });

    const paymentMethods = Object.entries(
      paymentMethodMap
    ).map(([method, amount]) => ({
      method,
      amount,
    }));

    // -----------------------------
    // RESPONSE
    // -----------------------------

    return NextResponse.json({
      success: true,

      summary: {
        totalClients,

        totalProjects,

        activeProjects,

        completedProjects,

        totalProjectBudget,

        totalInvoicedAmount,

        paidInvoiceAmount,

        pendingAmount,

        totalRevenue,

        pendingPaymentAmount,
      },

      monthlyRevenue,

      projectPerformance,

      invoiceBreakdown,

      paymentMethods,
    });
  } catch (error) {
    console.error(
      "Freelancer reports error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load reports.",
      },
      { status: 500 }
    );
  }
}