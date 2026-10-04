import { NextResponse } from "next/server";

import { linkClientRelationships, requireUser } from "@/lib/access";
import { serverError } from "@/lib/api";

/*
  POST /api/client/sync

  Connects every Client relationship that was created with the
  logged-in client's email to their account. Safe to call repeatedly:
  it never creates duplicates and never deletes anything.
*/
export async function POST() {
  try {
    const auth = await requireUser("client");
    if (auth.response) return auth.response;

    const connectedRelationships = await linkClientRelationships(auth.user);

    return NextResponse.json({
      success: true,
      message: "Client relationships synchronized.",
      connectedRelationships,
    });
  } catch (error) {
    return serverError(
      "Client sync error",
      error,
      "Failed to synchronize client relationships."
    );
  }
}
