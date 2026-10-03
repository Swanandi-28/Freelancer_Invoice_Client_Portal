import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Client from "@/models/Client";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const name = body.name?.trim();
    const email = body.email?.toLowerCase().trim();
    const password = body.password;
    const role = body.role;

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        {
          success: false,
          message: "All fields are required.",
        },
        { status: 400 }
      );
    }

    if (role !== "freelancer" && role !== "client") {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid role.",
        },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        {
          success: false,
          message: "Password must be at least 6 characters.",
        },
        { status: 400 }
      );
    }

    await connectDB();

    // Check whether the email is already registered.
    const existingUser = await User.findOne({
      email,
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: "An account with this email already exists.",
        },
        { status: 409 }
      );
    }

    // Hash password before saving.
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the user account.
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
    });

    /*
      CLIENT ACCOUNT CONNECTION

      If a freelancer already added this email
      as a client, connect that Client record
      to the newly created client User account.
    */
    if (role === "client") {
      await Client.updateMany(
        {
          email,
          user: { $exists: false },
        },
        {
          $set: {
            user: newUser._id,
          },
        }
      );
    }

    const safeUser = {
      id: newUser._id.toString(),
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
    };

    return NextResponse.json(
      {
        success: true,
        message: "Account created successfully.",
        user: safeUser,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong during registration.",
      },
      { status: 500 }
    );
  }
}