import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Project from "@/models/Project";
import Client from "@/models/Client";
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

    const projects = await Project.find(filter)
      .populate("client", "name company email")
      .populate("freelancer", "name email")
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      projects,
    });
  } catch (error) {
    console.error("Get projects error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch projects.",
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

    if (user.role !== "freelancer") {
      return NextResponse.json(
        { success: false, message: "Only freelancers can create projects." },
        { status: 403 }
      );
    }

    const body = await request.json();

    const {
      clientId,
      name,
      description,
      budget,
      deadline,
      status,
    } = body;

    if (!clientId || !name || budget === undefined || !deadline) {
      return NextResponse.json(
        {
          success: false,
          message: "Client, name, budget and deadline are required.",
        },
        { status: 400 }
      );
    }

    await connectDB();

    // Make sure the selected client actually belongs to this freelancer
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

    const project = await Project.create({
      freelancer: user.id,
      client: clientId,
      name: name.trim(),
      description: description || "",
      budget: Number(budget),
      deadline,
      status: status || "Pending",
    });

    return NextResponse.json(
      {
        success: true,
        message: "Project created successfully.",
        project,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create project error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create project.",
      },
      { status: 500 }
    );
  }
}