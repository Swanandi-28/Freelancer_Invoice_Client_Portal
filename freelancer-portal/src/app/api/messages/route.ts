import { NextResponse } from "next/server";

import connectDB from "@/lib/mongodb";
import Message from "@/models/Message";
import Client from "@/models/Client";
import Project from "@/models/Project";
import { getAuthenticatedUser } from "@/lib/auth";

// =====================================================
// GET MESSAGES
// =====================================================

export async function GET(request: Request) {
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
          message: "Only freelancers can access these messages.",
        },
        { status: 403 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);

    const clientId = searchParams.get("clientId");

    const query: any = {
      freelancer: user.id,
    };

    if (clientId) {
      query.client = clientId;
    }

    const messages = await Message.find(query)
      .populate("client", "name company email")
      .populate("project", "name")
      .sort({ createdAt: 1 })
      .lean();

    return NextResponse.json({
      success: true,
      messages,
    });
  } catch (error) {
    console.error("Get messages error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load messages.",
      },
      { status: 500 }
    );
  }
}

// =====================================================
// SEND MESSAGE
// =====================================================

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
          message: "Only freelancers can send messages.",
        },
        { status: 403 }
      );
    }

    await connectDB();

    const body = await request.json();

    const {
      clientId,
      projectId,
      message,
    } = body;

    // -------------------------------------------------
    // VALIDATION
    // -------------------------------------------------

    if (!clientId || !message?.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "Client and message are required.",
        },
        { status: 400 }
      );
    }

    // -------------------------------------------------
    // VERIFY CLIENT
    // -------------------------------------------------

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

    // -------------------------------------------------
    // VERIFY PROJECT IF PROVIDED
    // -------------------------------------------------

    let validProject = null;

    if (projectId) {
      validProject = await Project.findOne({
        _id: projectId,
        client: clientId,
        freelancer: user.id,
      });

      if (!validProject) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid project.",
          },
          { status: 403 }
        );
      }
    }

    // -------------------------------------------------
    // CREATE MESSAGE
    // -------------------------------------------------

    const newMessage = await Message.create({
      freelancer: user.id,
      client: clientId,

      project: validProject
        ? validProject._id
        : undefined,

      senderRole: "freelancer",

      senderId: user.id,

      message: message.trim(),

      read: true,
    });

    // -------------------------------------------------
    // RETURN MESSAGE
    // -------------------------------------------------

    const populatedMessage =
      await Message.findById(newMessage._id)
        .populate(
          "client",
          "name company email"
        )
        .populate(
          "project",
          "name"
        )
        .lean();

    return NextResponse.json(
      {
        success: true,
        message: populatedMessage,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Send message error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to send message.",
      },
      { status: 500 }
    );
  }
}