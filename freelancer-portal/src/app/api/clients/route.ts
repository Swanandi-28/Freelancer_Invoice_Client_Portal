import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Client from "@/models/Client";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { freelancerId, name, company, email } = body;

    if (!freelancerId || !name || !company || !email) {
      return NextResponse.json(
        {
          success: false,
          message: "All fields are required.",
        },
        { status: 400 }
      );
    }

    await connectDB();

    const client = await Client.create({
      freelancer: freelancerId,
      name: name.trim(),
      company: company.trim(),
      email: email.toLowerCase().trim(),
    });

    return NextResponse.json(
      {
        success: true,
        message: "Client created successfully.",
        client,
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

    const clients = await Client.find({
      freelancer: freelancerId,
    }).sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      clients,
    });
  } catch (error) {
    console.error("Get clients error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch clients.",
      },
      { status: 500 }
    );
  }
}