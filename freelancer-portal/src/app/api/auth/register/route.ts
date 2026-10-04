import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { cleanString, fail, isEmail, readJson, serverError } from "@/lib/api";
import { linkClientRelationships } from "@/lib/access";

export async function POST(request: Request) {
  try {
    const body = await readJson(request);

    if (!body) {
      return fail("Invalid request body.", 400);
    }

    const name = cleanString(body.name, 100);
    const email = cleanString(body.email, 254).toLowerCase();
    const password = typeof body.password === "string" ? body.password : "";
    const role = body.role;

    if (!name || !email || !password || !role) {
      return fail("All fields are required.", 400);
    }

    if (!isEmail(email)) {
      return fail("Please enter a valid email address.", 400);
    }

    if (role !== "freelancer" && role !== "client") {
      return fail("Invalid role.", 400);
    }

    if (password.length < 6) {
      return fail("Password must be at least 6 characters.", 400);
    }

    if (password.length > 72) {
      return fail("Password cannot be longer than 72 characters.", 400);
    }

    await connectDB();

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return fail("An account with this email already exists.", 409);
    }

    /*
      ADMINISTRATORS

      Nobody can choose the "admin" role in the registration form.
      An account becomes an administrator only when its email is listed
      in ADMIN_EMAILS in .env.local (comma separated), e.g.

        ADMIN_EMAILS="admin@example.com"

      Administrators manage freelancer accounts at /admin/freelancers.
    */
    const adminEmails = (process.env.ADMIN_EMAILS || "")
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean);

    const finalRole: "freelancer" | "client" | "admin" = adminEmails.includes(email)
      ? "admin"
      : role;

    // Hash password before saving.
    const hashedPassword = await bcrypt.hash(password, 10);

    let newUser;

    try {
      newUser = await User.create({
        name,
        email,
        password: hashedPassword,
        role: finalRole,
      });
    } catch (error) {
      // Two registrations with the same email at the same time.
      if ((error as { code?: number })?.code === 11000) {
        return fail("An account with this email already exists.", 409);
      }
      throw error;
    }

    /*
      CLIENT ACCOUNT CONNECTION

      If one or more freelancers already added this email as a client,
      connect those Client relationships to the new client account.
    */
    let connectedRelationships = 0;

    if (finalRole === "client") {
      connectedRelationships = await linkClientRelationships({
        id: newUser._id.toString(),
        email,
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: "Account created successfully.",
        user: {
          id: newUser._id.toString(),
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
        },
        connectedRelationships,
      },
      { status: 201 }
    );
  } catch (error) {
    return serverError(
      "Registration error",
      error,
      "Something went wrong during registration."
    );
  }
}
