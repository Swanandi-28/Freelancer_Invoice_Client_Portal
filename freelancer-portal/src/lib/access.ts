import { NextResponse } from "next/server";
import mongoose from "mongoose";

import connectDB from "@/lib/mongodb";
import { getAuthenticatedUser, type AuthUser } from "@/lib/auth";
import { fail, isObjectId } from "@/lib/api";
import Client from "@/models/Client";
import Project from "@/models/Project";
import User from "@/models/User";

/*
  =====================================================
  AUTHENTICATION
  =====================================================
  The user ALWAYS comes from the HTTP-only JWT cookie.
  Nothing sent by the browser (ids, roles) is trusted.
*/
export async function requireUser(
  role?: AuthUser["role"]
): Promise<
  { user: AuthUser; response?: undefined } | { user?: undefined; response: NextResponse }
> {
  const user = await getAuthenticatedUser();

  if (!user) {
    return { response: fail("Unauthorized.", 401) };
  }

  if (role && user.role !== role) {
    return {
      response: fail(
        role === "freelancer"
          ? "Only freelancers can perform this action."
          : role === "client"
            ? "Only clients can perform this action."
            : "Only administrators can perform this action.",
        403
      ),
    };
  }

  await connectDB();

  // The token is valid for 7 days, but the account may have been deleted
  // since it was issued (e.g. a freelancer removed by an administrator).
  const stillExists = await User.exists({ _id: user.id, role: user.role });

  if (!stillExists) {
    return { response: fail("Unauthorized.", 401) };
  }

  return { user };
}

/*
  =====================================================
  CLIENT RELATIONSHIP LINKING (SYNC)
  =====================================================
  A freelancer adds a client by email. That Client relationship is
  connected to the client's login account (Client.user) when:
    - the client registers / logs in, or
    - any client API is called (self-healing for old records).

  It only ever fills in a missing link, or replaces a link that points
  to a User that no longer exists. It never creates or deletes
  relationships.
*/
export async function linkClientRelationships(user: {
  id: string;
  email: string;
}): Promise<number> {
  const email = user.email.toLowerCase().trim();

  const unlinked = await Client.updateMany(
    {
      email,
      $or: [{ user: { $exists: false } }, { user: null }],
    },
    { $set: { user: user.id } }
  );

  let repaired = 0;

  // Old data: relationship points at an account that no longer exists.
  const mismatched = await Client.find({
    email,
    user: { $exists: true, $nin: [null, user.id] },
  }).select("_id user");

  for (const relationship of mismatched) {
    const stillExists = await User.exists({ _id: relationship.user });
    if (!stillExists) {
      await Client.updateOne(
        { _id: relationship._id },
        { $set: { user: user.id } }
      );
      repaired += 1;
    }
  }

  return (unlinked.modifiedCount || 0) + repaired;
}

/** Every freelancer-client relationship owned by this client account. */
export async function getClientRelationships(user: AuthUser) {
  await linkClientRelationships(user);

  return Client.find({ user: user.id })
    .populate("freelancer", "name email")
    .sort({ createdAt: -1 })
    .lean();
}

/*
  =====================================================
  DATA SCOPE
  =====================================================
  Builds the MongoDB filter that limits a query to what the
  authenticated user is allowed to see, and validates any ids
  supplied in the query string against that ownership.

  Freelancer: { freelancer: me }
  Client:     { client: { $in: my relationship ids } }

  Optional narrowing (all ownership-checked):
    clientId      - one Client relationship
    freelancerId  - (clients only) one freelancer's workspace
    projectId     - one project inside the scope
*/
export type Scope = {
  filter: Record<string, unknown>;
  relationshipIds: mongoose.Types.ObjectId[];
};

export async function resolveScope(
  user: AuthUser,
  params?: URLSearchParams
): Promise<{ scope: Scope; response?: undefined } | { scope?: undefined; response: NextResponse }> {
  const clientId = params?.get("clientId") || "";
  const freelancerId = params?.get("freelancerId") || "";
  const projectId = params?.get("projectId") || "";

  for (const [label, value] of [
    ["client", clientId],
    ["freelancer", freelancerId],
    ["project", projectId],
  ]) {
    if (value && !isObjectId(value)) {
      return { response: fail(`Invalid ${label} id.`, 400) };
    }
  }

  // Administrators manage accounts; they have no business data of their own.
  if (user.role === "admin") {
    return { response: fail("Administrators cannot access this resource.", 403) };
  }

  const filter: Record<string, unknown> = {};
  let relationshipIds: mongoose.Types.ObjectId[] = [];

  if (user.role === "freelancer") {
    filter.freelancer = user.id;

    if (clientId) {
      const client = await Client.findOne({
        _id: clientId,
        freelancer: user.id,
      }).select("_id");

      if (!client) {
        return { response: fail("Client not found.", 404) };
      }

      filter.client = client._id;
      relationshipIds = [client._id as mongoose.Types.ObjectId];
    }
  } else {
    let relationships = await getClientRelationships(user);

    if (clientId) {
      relationships = relationships.filter(
        (relationship) => relationship._id.toString() === clientId
      );
    }

    if (freelancerId) {
      relationships = relationships.filter((relationship) => {
        const freelancer = relationship.freelancer as unknown as {
          _id?: mongoose.Types.ObjectId;
        } | null;
        return freelancer?._id?.toString() === freelancerId;
      });
    }

    if ((clientId || freelancerId) && relationships.length === 0) {
      return {
        response: fail("You do not have access to this workspace.", 403),
      };
    }

    relationshipIds = relationships.map(
      (relationship) => relationship._id as mongoose.Types.ObjectId
    );
    filter.client = { $in: relationshipIds };
  }

  if (projectId) {
    const project = await Project.findOne({ ...filter, _id: projectId }).select(
      "_id"
    );

    if (!project) {
      return { response: fail("Project not found.", 404) };
    }

    filter.project = project._id;
  }

  return { scope: { filter, relationshipIds } };
}
