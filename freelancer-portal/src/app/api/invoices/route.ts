import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Invoice from "@/models/Invoice";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      freelancerId,
      clientId,
      projectId,
      invoiceNumber,
      amount,
      issueDate,
      dueDate,
      status,
    } = body;

    if (
      !freelancerId ||
      !clientId ||
      !projectId ||
      !invoiceNumber ||
      amount === undefined ||
      !issueDate ||
      !dueDate
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Required fields are missing.",
        },
        { status: 400 }
      );
    }

    await connectDB();

    const existingInvoice = await Invoice.findOne({
      invoiceNumber: invoiceNumber.trim(),
    });

    if (existingInvoice) {
      return NextResponse.json(
        {
          success: false,
          message: "Invoice number already exists.",
        },
        { status: 409 }
      );
    }

    const invoice = await Invoice.create({
      freelancer: freelancerId,
      client: clientId,
      project: projectId,
      invoiceNumber: invoiceNumber.trim(),
      amount: Number(amount),
      issueDate: new Date(issueDate),
      dueDate: new Date(dueDate),
      status: status || "Pending",
    });

    return NextResponse.json(
      {
        success: true,
        message: "Invoice created successfully.",
        invoice,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create invoice error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create invoice.",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const freelancerId = searchParams.get("freelancerId");

    if (!freelancerId) {
      return NextResponse.json(
        {
          success: false,
          message: "Freelancer ID is required.",
        },
        { status: 400 }
      );
    }

    await connectDB();

    const invoices = await Invoice.find({
      freelancer: freelancerId,
    })
      .populate("client", "name company email")
      .populate("project", "name budget")
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      invoices,
    });
  } catch (error) {
    console.error("Get invoices error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch invoices.",
      },
      { status: 500 }
    );
  }
}