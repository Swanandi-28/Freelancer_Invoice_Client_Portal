import { NextResponse } from "next/server";

import connectDB from "@/lib/mongodb";
import Client from "@/models/Client";
import { getAuthenticatedUser } from "@/lib/auth";

export async function POST() {
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

    if (user.role !== "client") {
      return NextResponse.json(
        {
          success: false,
          message: "Only clients can use this endpoint.",
        },
        { status: 403 }
      );
    }

    await connectDB();

    // Find all client-freelancer relationships
    // created using this client's email.
    const result = await Client.updateMany(
      {
        email: user.email,
        $or: [
          { user: { $exists: false } },
          { user: null },
        ],
      },
      {
        $set: {
          user: user.id,
        },
      }
    );

    return NextResponse.json({
      success: true,
      message: "Client relationships synchronized.",
      connectedRelationships: result.modifiedCount,
    });
  } catch (error) {
    console.error("Client sync error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to synchronize client relationships.",
      },
      { status: 500 }
    );
  }
}