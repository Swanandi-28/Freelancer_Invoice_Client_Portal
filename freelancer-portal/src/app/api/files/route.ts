import { NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import mongoose from "mongoose";

import connectDB from "@/lib/mongodb";
import FileModel from "@/models/File";
import Client from "@/models/Client";
import Project from "@/models/Project";
import { getAuthenticatedUser } from "@/lib/auth";
import { requireUser, resolveScope } from "@/lib/access";
import { isObjectId, serverError } from "@/lib/api";

export const runtime = "nodejs";

// =====================================================
// GET FILES
//   freelancer: files they uploaded      (?clientId= / ?projectId=)
//   client:     files of their own       (?clientId= / ?freelancerId= / ?projectId=)
//               freelancer relationships
//
// Each file includes `downloadUrl`, an authenticated route that
// re-checks ownership before sending the file.
// =====================================================
export async function GET(request: Request) {
  try {
    const auth = await requireUser();
    if (auth.response) return auth.response;

    const scoped = await resolveScope(
      auth.user,
      new URL(request.url).searchParams
    );
    if (scoped.response) return scoped.response;

    const files = await FileModel.find(scoped.scope.filter)
      .populate("client", "name company email")
      .populate("project", "name")
      .populate("freelancer", "name email")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      files: files.map((file) => ({
        ...file,
        downloadUrl: `/api/files/${file._id.toString()}/download`,
      })),
    });
  } catch (error) {
    return serverError("Get files error", error, "Failed to load files.");
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

    if (!isObjectId(clientId) || !isObjectId(projectId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid client or project.",
        },
        { status: 400 }
      );
    }

    if (uploadedFile.size === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "The selected file is empty.",
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

    // Files are kept OUTSIDE /public so they can never be opened by
    // guessing a URL. They are only served by the authenticated
    // /api/files/:id/download route, which re-checks ownership.
    const uploadDirectory = path.join(process.cwd(), "uploads");

    await mkdir(uploadDirectory, {
      recursive: true,
    });

    // -------------------------------------------------
    // GENERATE SAFE UNIQUE FILE NAME
    // -------------------------------------------------

    const originalName =
      path.basename(uploadedFile.name || "file").slice(0, 200) || "file";

    // Only keep a simple, safe extension (e.g. ".pdf").
    const rawExtension = path.extname(originalName).toLowerCase();
    const extension = /^\.[a-z0-9]{1,10}$/.test(rawExtension)
      ? rawExtension
      : "";

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
    // DOWNLOAD URL (authenticated route, not a public path)
    // -------------------------------------------------

    const fileId = new mongoose.Types.ObjectId();

    const fileUrl =
      `/api/files/${fileId.toString()}/download`;

    // -------------------------------------------------
    // SAVE FILE INFORMATION TO MONGODB
    // -------------------------------------------------

    const savedFile = await FileModel.create({
      _id: fileId,
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
        file: populatedFile
          ? {
              ...populatedFile,
              downloadUrl: `/api/files/${savedFile._id.toString()}/download`,
            }
          : null,
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