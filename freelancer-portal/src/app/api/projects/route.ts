import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Project from "@/models/Project";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      freelancerId,
      clientId,
      name,
      description,
      budget,
      deadline,
      status,
    } = body;

    if (
      !freelancerId ||
      !clientId ||
      !name ||
      budget === undefined ||
      !deadline
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

    const project = await Project.create({
      freelancer: freelancerId,
      client: clientId,
      name: name.trim(),
      description: description?.trim() || "",
      budget: Number(budget),
      deadline: new Date(deadline),
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

    const projects = await Project.find({
      freelancer: freelancerId,
    })
      .populate("client", "name company email")
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