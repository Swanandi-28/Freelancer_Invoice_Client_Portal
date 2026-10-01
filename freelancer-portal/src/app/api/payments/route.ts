import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Payment from "@/models/Payment";
import Invoice from "@/models/Invoice";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const freelancerId = searchParams.get("freelancerId");

    if (!freelancerId) {
      return NextResponse.json(
        { success: false, message: "Freelancer ID is required." },
        { status: 400 }
      );
    }

    await connectDB();

    const payments = await Payment.find({
      freelancer: freelancerId,
    })
      .populate("client", "name company email")
      .populate("project", "name")
      .populate("invoice", "invoiceNumber")
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
    const body = await request.json();

    const {
      freelancerId,
      clientId,
      projectId,
      invoiceId,
      amount,
      paymentDate,
      paymentMethod,
      status,
    } = body;

    if (
      !freelancerId ||
      !clientId ||
      !projectId ||
      !invoiceId ||
      !amount ||
      !paymentDate
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "All required fields must be provided.",
        },
        { status: 400 }
      );
    }

    await connectDB();

    const payment = await Payment.create({
      freelancer: freelancerId,
      client: clientId,
      project: projectId,
      invoice: invoiceId,
      amount: Number(amount),
      paymentDate,
      paymentMethod: paymentMethod || "Other",
      status: status || "Completed",
    });

    // Mark invoice as paid when payment is completed
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