import { NextResponse } from "next/server";

import Message from "@/models/Message";
import { requireUser, resolveScope } from "@/lib/access";
import { serverError } from "@/lib/api";

/*
  GET /api/messages/unread

  Unread counts for the authenticated user, grouped by conversation
  (Client relationship id):

    { unread: { "<clientRelationshipId>": 2, ... }, total: 2 }

  "Unread" = sent by the OTHER person and not yet opened by me.
  Only the user's own relationships are counted.
*/
export async function GET() {
  try {
    const auth = await requireUser();
    if (auth.response) return auth.response;
    const user = auth.user;

    const scoped = await resolveScope(user);
    if (scoped.response) return scoped.response;

    const messages = await Message.find({
      ...scoped.scope.filter,
      senderRole: user.role === "freelancer" ? "client" : "freelancer",
      read: false,
    })
      .select("client")
      .lean();

    const unread: Record<string, number> = {};

    for (const message of messages) {
      const key = message.client.toString();
      unread[key] = (unread[key] || 0) + 1;
    }

    return NextResponse.json({
      success: true,
      unread,
      total: messages.length,
    });
  } catch (error) {
    return serverError("Unread messages error", error, "Failed to load unread counts.");
  }
}
