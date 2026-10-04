import { NextResponse } from "next/server";

import Client from "@/models/Client";
import { requireUser } from "@/lib/access";
import { deleteClientRelationship } from "@/lib/cascade";
import { fail, isObjectId, serverError } from "@/lib/api";

/*
  DELETE /api/clients/:id

  Removes ONE freelancer-client relationship and everything that belongs
  to it: projects, invoices, payments, files (database + disk), messages.

  - The freelancer comes from the JWT cookie, never from the request.
  - The relationship must belong to that freelancer (otherwise 403).
  - The client's login account (User) is NOT deleted, and other
    freelancers' relationships with the same client are not touched.
*/
export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireUser("freelancer");
    if (auth.response) return auth.response;

    const { id } = await context.params;

    if (!isObjectId(id)) {
      return fail("Client not found.", 404);
    }

    const client = await Client.findById(id)
      .select("_id freelancer name company")
      .lean();

    if (!client) {
      return fail("Client not found.", 404);
    }

    if (client.freelancer.toString() !== auth.user.id) {
      return fail("You are not allowed to delete this client.", 403);
    }

    const deleted = await deleteClientRelationship(auth.user.id, client._id);

    return NextResponse.json({
      success: true,
      message: `${client.company || client.name} and all associated data were deleted. The client's login account was not deleted.`,
      deleted,
    });
  } catch (error) {
    return serverError("Delete client error", error, "Failed to delete client.");
  }
}
