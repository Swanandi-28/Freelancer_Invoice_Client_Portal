import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Payment from "@/models/Payment";
import Invoice from "@/models/Invoice";
import Client from "@/models/Client";
import Project from "@/models/Project";
import { getAuthenticatedUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized." },
        { status: 401 }
      );
    }

    await connectDB();

    const linkedClients = user.role === "client"
      ? await Client.find({ email: user.email }).select("_id")
      : [];
    const clientIds = linkedClients.map((client) => client._id);
    const filter = user.role === "freelancer"
      ? { freelancer: user.id }
      : { client: { $in: clientIds } };

    const payments = await Payment.find(filter)
      .populate("client", "name company email")
      .populate("project", "name")
      .populate("invoice", "invoiceNumber")
      .populate("freelancer", "name email")
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      payments,
    });
  } catch (error) {
    console.error("Get payments error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch payments.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized." },
        { status: 401 }
      );
    }

    const body = await request.json();

    if (user.role === "client") {
      const { invoiceId, paymentMethod } = body;
      if (!invoiceId) {
        return NextResponse.json({ success: false, message: "Invoice is required." }, { status: 400 });
      }
      await connectDB();
      const linkedClients = await Client.find({ email: user.email }).select("_id");
      const invoice = await Invoice.findOne({
        _id: invoiceId,
        client: { $in: linkedClients.map((client) => client._id) },
        status: { $ne: "Paid" },
      });
      if (!invoice) {
        return NextResponse.json({ success: false, message: "Invoice not found or already paid." }, { status: 404 });
      }
      const payment = await Payment.create({
        freelancer: invoice.freelancer,
        client: invoice.client,
        project: invoice.project,
        invoice: invoice._id,
        amount: invoice.amount,
        paymentDate: new Date(),
        paymentMethod: paymentMethod || "Other",
        status: "Completed",
      });
      invoice.status = "Paid";
      await invoice.save();
      return NextResponse.json({ success: true, message: "Payment recorded.", payment }, { status: 201 });
    }

    const {
      clientId,
      projectId,
      invoiceId,
      amount,
      paymentDate,
      paymentMethod,
      status,
    } = body;

    if (
      !clientId ||
      !projectId ||
      !invoiceId ||
      amount === undefined ||
      !paymentDate
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "All required payment fields must be provided.",
        },
        { status: 400 }
      );
    }

    await connectDB();

    // Verify client belongs to logged-in freelancer
    const client = await Client.findOne({
      _id: clientId,
      freelancer: user.id,
    });

    if (!client) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid client.",
        },
        { status: 403 }
      );
    }

    // Verify project belongs to this freelancer and client
    const project = await Project.findOne({
      _id: projectId,
      freelancer: user.id,
      client: clientId,
    });

    if (!project) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid project.",
        },
        { status: 403 }
      );
    }

    // Verify invoice belongs to this freelancer/client/project
    const invoice = await Invoice.findOne({
      _id: invoiceId,
      freelancer: user.id,
      client: clientId,
      project: projectId,
    });

    if (!invoice) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid invoice.",
        },
        { status: 403 }
      );
    }

    const payment = await Payment.create({
      freelancer: user.id,
      client: clientId,
      project: projectId,
      invoice: invoiceId,
      amount: Number(amount),
      paymentDate,
      paymentMethod: paymentMethod || "Other",
      status: status || "Completed",
    });

    if ((status || "Completed") === "Completed") {
      await Invoice.findByIdAndUpdate(invoiceId, {
        status: "Paid",
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: "Payment recorded successfully.",
        payment,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create payment error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to record payment.",
      },
      { status: 500 }
    );
  }
}