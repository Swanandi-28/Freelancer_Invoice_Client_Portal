import { NextResponse } from "next/server";
import mongoose from "mongoose";

import Message from "@/models/Message";
import Client from "@/models/Client";
import Project from "@/models/Project";
import { getClientRelationships, requireUser, resolveScope } from "@/lib/access";
import { cleanString, fail, isObjectId, readJson, serverError } from "@/lib/api";

/*
  Messages are private to ONE freelancer-client relationship
  (Message.client = the Client relationship document).

    Freelancer A <-> ABC Company   is a different conversation from
    Freelancer B <-> ABC Company

  Both roles use this same route; the server works out which
  conversations the logged-in user may see.
*/

// =====================================================
// GET MESSAGES  (?clientId= for one conversation)
//   freelancer: messages where freelancer = me
//   client:     messages where client IN my Client relationship ids
// =====================================================
export async function GET(request: Request) {
  try {
    const auth = await requireUser();
    if (auth.response) return auth.response;
    const user = auth.user;

    const params = new URL(request.url).searchParams;

    const scoped = await resolveScope(user, params);
    if (scoped.response) return scoped.response;

    // Reading the list does NOT mark anything as read. That happens only
    // when the recipient opens the conversation: PATCH /api/messages/read.
    const messages = await Message.find(scoped.scope.filter)
      .populate("client", "name company email")
      .populate("project", "name")
      .populate("freelancer", "name email")
      .sort({ createdAt: 1 })
      .lean();

    return NextResponse.json({ success: true, messages });
  } catch (error) {
    return serverError("Get messages error", error, "Failed to load messages.");
  }
}

// =====================================================
// SEND MESSAGE
//   body: { clientId, message, projectId? }
//   clientId = the Client relationship id (the conversation)
// =====================================================
export async function POST(request: Request) {
  try {
    const auth = await requireUser();
    if (auth.response) return auth.response;
    const user = auth.user;

    if (user.role === "admin") {
      return fail("Administrators cannot send messages.", 403);
    }
    const senderRole: "freelancer" | "client" = user.role;

    const body = await readJson(request);
    if (!body) return fail("Invalid request body.", 400);

    const { clientId, projectId } = body;
    const text = cleanString(body.message, 5000);

    if (!clientId || !text) {
      return fail("Conversation and message are required.", 400);
    }

    if (!isObjectId(clientId) || (projectId && !isObjectId(projectId))) {
      return fail("Invalid client or project id.", 400);
    }

    // ---------- Verify the relationship belongs to the sender ----------
    let relationship: {
      _id: mongoose.Types.ObjectId;
      freelancer?: mongoose.Types.ObjectId;
    } | null = null;

    if (user.role === "freelancer") {
      const owned = await Client.findOne({
        _id: clientId,
        freelancer: user.id,
      })
        .select("_id freelancer")
        .lean();

      if (owned) {
        relationship = {
          _id: owned._id as mongoose.Types.ObjectId,
          freelancer: owned.freelancer,
        };
      }
    } else {
      const relationships = await getClientRelationships(user);
      const match = relationships.find(
        (item) => item._id.toString() === clientId
      );

      if (match) {
        const freelancer = match.freelancer as unknown as {
          _id?: mongoose.Types.ObjectId;
        } | null;
        relationship = {
          _id: match._id as mongoose.Types.ObjectId,
          freelancer: freelancer?._id,
        };
      }
    }

    if (!relationship || !relationship.freelancer) {
      return fail("Conversation not found.", 404);
    }

    // ---------- Optional project must be inside the same relationship ----------
    let validProject = null;

    if (projectId) {
      validProject = await Project.findOne({
        _id: projectId,
        client: relationship._id,
        freelancer: relationship.freelancer,
      }).select("_id");

      if (!validProject) {
        return fail("This project does not belong to this conversation.", 400);
      }
    }

    const newMessage = await Message.create({
      freelancer: relationship.freelancer,
      client: relationship._id,
      project: validProject ? validProject._id : undefined,
      senderRole,
      senderId: user.id,
      message: text,
      read: false, // unread until the other side opens the conversation
    });

    const populatedMessage = await Message.findById(newMessage._id)
      .populate("client", "name company email")
      .populate("project", "name")
      .populate("freelancer", "name email")
      .lean();

    return NextResponse.json(
      { success: true, message: populatedMessage },
      { status: 201 }
    );
  } catch (error) {
    return serverError("Send message error", error, "Failed to send message.");
  }
}
