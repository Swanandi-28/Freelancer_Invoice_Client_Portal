import { NextResponse } from "next/server";

import Project from "@/models/Project";
import Client from "@/models/Client";
import { requireUser, resolveScope } from "@/lib/access";
import { withProjectAmounts } from "@/lib/finance";
import {
  cleanString,
  fail,
  isObjectId,
  parseDate,
  readJson,
  roundMoney,
  serverError,
} from "@/lib/api";

const PROJECT_STATUSES = ["In Progress", "Completed", "Pending"] as const;

// =====================================================
// GET PROJECTS
//   freelancer: own projects        (?clientId=)
//   client:     projects of their   (?clientId= / ?freelancerId=)
//               relationships
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

    const projects = await Project.find(scoped.scope.filter)
      .populate("client", "name company email")
      .populate("freelancer", "name email")
      .sort({ createdAt: -1 })
      .lean();

    // budget / paidAmount / pendingAmount per project, where
    // pendingAmount = budget - completed payments of THAT project.
    return NextResponse.json({
      success: true,
      projects: await withProjectAmounts(projects),
    });
  } catch (error) {
    return serverError("Get projects error", error, "Failed to fetch projects.");
  }
}

// =====================================================
// CREATE PROJECT (freelancer only)
// =====================================================
export async function POST(request: Request) {
  try {
    const auth = await requireUser("freelancer");
    if (auth.response) return auth.response;
    const user = auth.user;

    const body = await readJson(request);
    if (!body) return fail("Invalid request body.", 400);

    const clientId = body.clientId;
    const name = cleanString(body.name, 150);
    const description = cleanString(body.description, 2000);
    const budget = Number(body.budget);
    const deadline = parseDate(body.deadline);
    const status = body.status || "Pending";

    if (!clientId || !name || body.budget === undefined || body.budget === "" || !body.deadline) {
      return fail("Client, name, budget and deadline are required.", 400);
    }

    if (!isObjectId(clientId)) {
      return fail("Invalid client id.", 400);
    }

    if (!Number.isFinite(budget) || budget < 0 || budget > 1e12) {
      return fail("Budget must be a valid, non-negative amount.", 400);
    }

    if (!deadline) {
      return fail("Deadline must be a valid date.", 400);
    }

    if (!PROJECT_STATUSES.includes(status as (typeof PROJECT_STATUSES)[number])) {
      return fail("Invalid project status.", 400);
    }

    // The selected client must belong to this freelancer.
    const client = await Client.findOne({ _id: clientId, freelancer: user.id });

    if (!client) {
      return fail("Client not found.", 404);
    }

    const project = await Project.create({
      freelancer: user.id,
      client: client._id,
      name,
      description,
      budget: roundMoney(budget),
      deadline,
      status: status as (typeof PROJECT_STATUSES)[number],
    });

    const populatedProject = await Project.findById(project._id)
      .populate("client", "name company email")
      .lean();

    return NextResponse.json(
      {
        success: true,
        message: "Project created successfully.",
        project: populatedProject
          ? (await withProjectAmounts([populatedProject]))[0]
          : null,
      },
      { status: 201 }
    );
  } catch (error) {
    return serverError("Create project error", error, "Failed to create project.");
  }
}
