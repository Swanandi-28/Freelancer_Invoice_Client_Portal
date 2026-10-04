import { NextResponse } from "next/server";

import User from "@/models/User";
import { requireUser } from "@/lib/access";
import { deleteFreelancerAccount } from "@/lib/cascade";
import { fail, isObjectId, serverError } from "@/lib/api";

/*
  DELETE /api/admin/freelancers/:id   (administrators only)

  Deletes a freelancer account and everything that freelancer owns:
  client relationships, projects, invoices, payments, files, messages.

  Clients' own login accounts are NOT deleted, and other freelancers'
  relationships with the same clients are not touched.
*/
export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireUser("admin");
    if (auth.response) return auth.response;

    const { id } = await context.params;

    if (!isObjectId(id)) {
      return fail("Freelancer not found.", 404);
    }

    // Only freelancer accounts can be removed through this route.
    const freelancer = await User.findOne({ _id: id, role: "freelancer" })
      .select("_id name email")
      .lean();

    if (!freelancer) {
      return fail("Freelancer not found.", 404);
    }

    const deleted = await deleteFreelancerAccount(freelancer._id);

    return NextResponse.json({
      success: true,
      message: `Freelancer ${freelancer.name} and all of their data were deleted. Client login accounts were not deleted.`,
      deleted,
    });
  } catch (error) {
    return serverError("Delete freelancer error", error, "Failed to delete freelancer.");
  }
}
