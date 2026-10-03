import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Client from "@/models/Client";
import Project from "@/models/Project";
import Invoice from "@/models/Invoice";
import Payment from "@/models/Payment";
import { getAuthenticatedUser } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized." },
        { status: 401 }
      );
    }

    if (user.role !== "client") {
      return NextResponse.json(
        { success: false, message: "Only clients can access workspaces." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const freelancerId = searchParams.get("freelancerId");

    if (!freelancerId) {
      return NextResponse.json(
        { success: false, message: "Freelancer ID is required." },
        { status: 400 }
      );
    }

    await connectDB();

    /*
      Find the client-freelancer relationship.

      The important security condition is that BOTH are checked:
      - client email belongs to logged-in client
      - freelancer matches selected freelancer
    */

    const clientRecord = await Client.findOne({
      email: user.email,
      freelancer: freelancerId,
    })
      .populate("freelancer", "name email")
      .lean();

    if (!clientRecord) {
      return NextResponse.json(
        {
          success: false,
          message: "You do not have access to this workspace.",
        },
        { status: 403 }
      );
    }

    const clientId = clientRecord._id;

    /*
      Only retrieve projects belonging to this exact
      client-freelancer relationship.
    */

    const projects = await Project.find({
      _id: {
        $exists: true,
      },
      client: clientId,
      freelancer: freelancerId,
    })
      .sort({ createdAt: -1 })
      .lean();

    /*
      Only retrieve invoices belonging to this exact
      client-freelancer relationship.
    */

    const invoices = await Invoice.find({
      client: clientId,
      freelancer: freelancerId,
    })
      .populate("project", "name")
      .sort({ createdAt: -1 })
      .lean();

    /*
      Only retrieve payments belonging to this exact
      client-freelancer relationship.
    */

    const payments = await Payment.find({
      client: clientId,
      freelancer: freelancerId,
    })
      .populate("project", "name")
      .populate("invoice", "invoiceNumber")
      .sort({ paymentDate: -1 })
      .lean();

    return NextResponse.json({
      success: true,

      freelancer: clientRecord.freelancer,

      client: {
        id: clientRecord._id.toString(),
        name: clientRecord.name,
        company: clientRecord.company,
        email: clientRecord.email,
      },

      projects,
      invoices,
      payments,
    });
  } catch (error) {
    console.error("Client workspace error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load workspace.",
      },
      { status: 500 }
    );
  }
}