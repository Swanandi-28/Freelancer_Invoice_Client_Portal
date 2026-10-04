import { readFile } from "fs/promises";
import path from "path";

import FileModel from "@/models/File";
import { requireUser, resolveScope } from "@/lib/access";
import { fail, isObjectId, serverError } from "@/lib/api";

export const runtime = "nodejs";

/*
  GET /api/files/:id/download

  Sends a file only if it belongs to the authenticated user:
    freelancer -> file.freelancer is me
    client     -> file.client is one of MY Client relationships

  Changing the id in the URL to another user's file returns 404.
*/
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireUser();
    if (auth.response) return auth.response;

    const { id } = await context.params;

    if (!isObjectId(id)) {
      return fail("Invalid file id.", 400);
    }

    const scoped = await resolveScope(auth.user);
    if (scoped.response) return scoped.response;

    const file = await FileModel.findOne({
      ...scoped.scope.filter,
      _id: id,
    }).lean();

    if (!file) {
      return fail("File not found.", 404);
    }

    // basename() guarantees we can never read outside the uploads folders.
    const safeName = path.basename(file.fileName);

    // New uploads live in the private /uploads folder. Files uploaded by
    // older versions of the app were saved in /public/uploads.
    const candidates = [
      path.join(process.cwd(), "uploads", safeName),
      path.join(process.cwd(), "public", "uploads", safeName),
    ];

    let buffer: Buffer | null = null;

    for (const candidate of candidates) {
      try {
        buffer = await readFile(candidate);
        break;
      } catch {
        // try the next location
      }
    }

    if (!buffer) {
      return fail("This file is no longer available on the server.", 404);
    }

    const asciiName = file.originalName.replace(/[^\x20-\x7E]|["\\]/g, "_");

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": file.fileType || "application/octet-stream",
        "Content-Length": String(buffer.length),
        "Content-Disposition": `attachment; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(file.originalName)}`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return serverError("Download file error", error, "Failed to download file.");
  }
}
