import { NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

import connectDB from "@/lib/mongodb";
import FileModel from "@/models/File";
import Client from "@/models/Client";
import Project from "@/models/Project";
import { getAuthenticatedUser } from "@/lib/auth";

export const runtime = "nodejs";

// =====================================================
// GET FILES
// =====================================================

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
          message: "Only freelancers can access files.",
        },
        { status: 403 }
      );
    }

    await connectDB();

    const files = await FileModel.find({
      freelancer: user.id,
    })
      .populate("client", "name company email")
      .populate("project", "name")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      files,
    });
  } catch (error) {
    console.error("Get files error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load files.",
      },
      { status: 500 }
    );
  }
}

// =====================================================
// UPLOAD FILE
// =====================================================

export async function POST(request: Request) {
  try {
    // -------------------------------------------------
    // AUTHENTICATION
    // -------------------------------------------------

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
          message: "Only freelancers can upload files.",
        },
        { status: 403 }
      );
    }

    await connectDB();

    // -------------------------------------------------
    // FORM DATA
    // -------------------------------------------------

    const formData = await request.formData();

    const uploadedFile = formData.get("file");
    const clientId = formData.get("clientId")?.toString();
    const projectId = formData.get("projectId")?.toString();

    // -------------------------------------------------
    // VALIDATE FILE
    // -------------------------------------------------

    if (
      !uploadedFile ||
      !(uploadedFile instanceof globalThis.File)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Please select a valid file.",
        },
        { status: 400 }
      );
    }

    if (!clientId || !projectId) {
      return NextResponse.json(
        {
          success: false,
          message: "Client and project are required.",
        },
        { status: 400 }
      );
    }

    // -------------------------------------------------
    // FILE SIZE LIMIT
    // -------------------------------------------------
    // 10 MB maximum for this local project.
    // -------------------------------------------------

    const MAX_FILE_SIZE = 10 * 1024 * 1024;

    if (uploadedFile.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          message: "File size cannot exceed 10 MB.",
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
    // VERIFY PROJECT
    // -------------------------------------------------

    const project = await Project.findOne({
      _id: projectId,
      client: clientId,
      freelancer: user.id,
    });

    if (!project) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid project.",
        },
        { status: 403 }
      );
    }

    // -------------------------------------------------
    // CREATE UPLOAD DIRECTORY
    // -------------------------------------------------

    const uploadDirectory = path.join(
      process.cwd(),
      "public",
      "uploads"
    );

    await mkdir(uploadDirectory, {
      recursive: true,
    });

    // -------------------------------------------------
    // GENERATE SAFE UNIQUE FILE NAME
    // -------------------------------------------------

    const originalName = uploadedFile.name;

    const extension = path.extname(originalName);

    const safeFileName =
      `${randomUUID()}${extension}`;

    const filePath = path.join(
      uploadDirectory,
      safeFileName
    );

    // -------------------------------------------------
    // READ FILE
    // -------------------------------------------------

    const arrayBuffer =
      await uploadedFile.arrayBuffer();

    const buffer = Buffer.from(arrayBuffer);

    // -------------------------------------------------
    // SAVE PHYSICAL FILE
    // -------------------------------------------------

    await writeFile(filePath, buffer);

    // -------------------------------------------------
    // PUBLIC URL
    // -------------------------------------------------

    const fileUrl =
      `/uploads/${safeFileName}`;

    // -------------------------------------------------
    // SAVE FILE INFORMATION TO MONGODB
    // -------------------------------------------------

    const savedFile = await FileModel.create({
      freelancer: user.id,
      client: clientId,
      project: projectId,

      fileName: safeFileName,
      originalName,

      fileUrl,

      fileSize: uploadedFile.size,

      fileType:
        uploadedFile.type ||
        "application/octet-stream",
    });

    // -------------------------------------------------
    // RETURN CREATED FILE
    // -------------------------------------------------

    const populatedFile =
      await FileModel.findById(savedFile._id)
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
        message: "File uploaded successfully.",
        file: populatedFile,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Upload file error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to upload file.",
      },
      { status: 500 }
    );
  }
}