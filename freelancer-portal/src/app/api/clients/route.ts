import { NextResponse } from "next/server";

import connectDB from "@/lib/mongodb";
import Client from "@/models/Client";
import User from "@/models/User";
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
          message: "Only freelancers can access clients.",
        },
        { status: 403 }
      );
    }

    await connectDB();

    const clients = await Client.find({
      freelancer: user.id,
    })
      .populate("user", "name email role")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      clients,
    });
  } catch (error) {
    console.error("Get clients error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load clients.",
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
          message: "Only freelancers can add clients.",
        },
        { status: 403 }
      );
    }

    await connectDB();

    const body = await request.json();

    const name = body.name?.trim();
    const company = body.company?.trim();
    const email = body.email?.toLowerCase().trim();

    if (!name || !company || !email) {
      return NextResponse.json(
        {
          success: false,
          message: "Name, company and email are required.",
        },
        { status: 400 }
      );
    }

    // Check whether a client with this email
    // is already connected to this freelancer.
    const existingClient = await Client.findOne({
      freelancer: user.id,
      email,
    });

    if (existingClient) {
      return NextResponse.json(
        {
          success: false,
          message: "This client is already added.",
        },
        { status: 409 }
      );
    }

    // Find the client's login account.
    const clientUser = await User.findOne({
      email,
      role: "client",
    });

    /*
      If the client has already registered,
      automatically connect the Client record
      to their User account.
    */
    const client = await Client.create({
      freelancer: user.id,
      user: clientUser ? clientUser._id : undefined,
      name,
      company,
      email,
    });

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
    console.error("Create client error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create client.",
      },
      { status: 500 }
    );
  }
}