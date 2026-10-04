import { NextResponse } from "next/server";

import Message from "@/models/Message";
import { requireUser, resolveScope } from "@/lib/access";
import { fail, isObjectId, readJson, serverError } from "@/lib/api";

/*
  PATCH /api/messages/read
  body: { clientId }   clientId = the Client relationship (the conversation)

  Called when a user OPENS a conversation. Marks as read only the
  messages sent BY THE OTHER PERSON in that conversation:

    freelancer opens -> messages with senderRole "client"     become read
    client opens     -> messages with senderRole "freelancer" become read

  A user's own messages are never changed here - they become read only
  when the recipient opens the conversation.
*/
export async function PATCH(request: Request) {
  try {
    const auth = await requireUser();
    if (auth.response) return auth.response;
    const user = auth.user;

    const body = await readJson(request);
    const clientId = body?.clientId;

    if (!isObjectId(clientId)) {
      return fail("A valid conversation is required.", 400);
    }

    // Verifies the conversation belongs to the authenticated user
    // (freelancer: own client; client: one of their own relationships).
    const scoped = await resolveScope(user, new URLSearchParams({ clientId }));
    if (scoped.response) return scoped.response;

    const result = await Message.updateMany(
      {
        ...scoped.scope.filter,
        senderRole: user.role === "freelancer" ? "client" : "freelancer",
        read: false,
      },
      { $set: { read: true } }
    );

    return NextResponse.json({
      success: true,
      markedRead: result.modifiedCount || 0,
    });
  } catch (error) {
    return serverError("Mark messages read error", error, "Failed to update messages.");
  }
}
