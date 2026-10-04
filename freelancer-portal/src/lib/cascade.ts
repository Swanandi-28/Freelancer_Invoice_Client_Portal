import { unlink } from "fs/promises";
import path from "path";
import mongoose from "mongoose";

import Client from "@/models/Client";
import Project from "@/models/Project";
import Invoice from "@/models/Invoice";
import Payment from "@/models/Payment";
import FileModel from "@/models/File";
import Message from "@/models/Message";
import User from "@/models/User";

/*
  =====================================================
  CASCADE DELETION
  =====================================================

  Permanently removes ONE freelancer-client relationship (or everything
  a freelancer owns) together with all dependent records, in this order:

    Payments -> Invoices -> Files -> Messages -> Projects
      -> Client relationship(s) -> (Freelancer User)

  ISOLATION: every filter below includes `freelancer: <owner id>`, so
  another freelancer's relationship with the same client - and all of
  its projects, invoices, payments, files and messages - is never touched.

  A client's own login account (User with role "client") is NEVER
  deleted here. Only a freelancer's User is removed, and only by
  deleteFreelancerAccount().

  The database work runs inside a MongoDB transaction when the server
  supports it (replica sets, e.g. MongoDB Atlas), so a failure half-way
  rolls everything back. On a standalone server without transactions it
  falls back to the same ordered deletion, children first, so a failure
  can never leave records pointing at a parent that no longer exists.
*/

export type CascadeResult = {
  clients: number;
  projects: number;
  invoices: number;
  payments: number;
  files: number;
  messages: number;
  filesRemovedFromDisk: number;
};

type Id = mongoose.Types.ObjectId | string;

function transactionsUnsupported(error: unknown): boolean {
  const { code, codeName, message } = (error || {}) as {
    code?: number;
    codeName?: string;
    message?: string;
  };

  return (
    code === 20 || // IllegalOperation: not a replica set member
    code === 59 || // CommandNotFound
    code === 115 || // CommandNotSupported
    code === 238 || // NotImplemented
    code === 263 || // OperationNotSupportedInTransaction
    /IllegalOperation|NotImplemented|CommandNotFound/.test(codeName || "") ||
    /Transaction numbers are only allowed|replica set|transactions? (is|are) not supported|not implemented/i.test(
      message || ""
    )
  );
}

/** Removes uploaded files from disk. A missing file is not an error. */
async function removePhysicalFiles(fileNames: string[]): Promise<number> {
  let removed = 0;

  for (const fileName of fileNames) {
    // basename() guarantees we never touch anything outside the upload folders.
    const safeName = path.basename(fileName || "");
    if (!safeName) continue;

    const candidates = [
      path.join(process.cwd(), "uploads", safeName),
      path.join(process.cwd(), "public", "uploads", safeName),
    ];

    for (const candidate of candidates) {
      try {
        await unlink(candidate);
        removed += 1;
      } catch {
        // Already missing (or not in this folder) - carry on.
      }
    }
  }

  return removed;
}

async function cascade(options: {
  freelancerId: Id;
  /** One relationship, or null for everything the freelancer owns. */
  clientId: Id | null;
  deleteFreelancerUser: boolean;
}): Promise<CascadeResult> {
  const { freelancerId, clientId, deleteFreelancerUser } = options;
  const owner = { freelancer: freelancerId };

  // ---------- 1. Work out exactly what will be deleted ----------
  let filters: {
    payments: Record<string, unknown>;
    invoices: Record<string, unknown>;
    files: Record<string, unknown>;
    messages: Record<string, unknown>;
    projects: Record<string, unknown>;
    clients: Record<string, unknown>;
  };

  if (clientId) {
    const projects = await Project.find({ ...owner, client: clientId })
      .select("_id")
      .lean();
    const projectIds = projects.map((project) => project._id);

    const invoices = await Invoice.find({
      ...owner,
      $or: [{ client: clientId }, { project: { $in: projectIds } }],
    })
      .select("_id")
      .lean();
    const invoiceIds = invoices.map((invoice) => invoice._id);

    filters = {
      payments: {
        ...owner,
        $or: [
          { client: clientId },
          { project: { $in: projectIds } },
          { invoice: { $in: invoiceIds } },
        ],
      },
      invoices: { ...owner, _id: { $in: invoiceIds } },
      files: {
        ...owner,
        $or: [{ client: clientId }, { project: { $in: projectIds } }],
      },
      messages: { ...owner, client: clientId },
      projects: { ...owner, _id: { $in: projectIds } },
      clients: { ...owner, _id: clientId },
    };
  } else {
    filters = {
      payments: owner,
      invoices: owner,
      files: owner,
      messages: owner,
      projects: owner,
      clients: owner,
    };
  }

  // File names are read BEFORE the metadata is deleted.
  const fileDocuments = await FileModel.find(filters.files)
    .select("fileName")
    .lean();
  const fileNames = fileDocuments.map((file) => file.fileName);

  // ---------- 2. Ordered deletion (children first) ----------
  // Becomes true once the first delete of an attempt has succeeded.
  let progressed = false;

  const run = async (session?: mongoose.ClientSession) => {
    const opts = session ? { session } : {};
    progressed = false;

    const payments = await Payment.deleteMany(filters.payments, opts);
    progressed = true;
    const invoices = await Invoice.deleteMany(filters.invoices, opts);
    const files = await FileModel.deleteMany(filters.files, opts);
    const messages = await Message.deleteMany(filters.messages, opts);
    const projects = await Project.deleteMany(filters.projects, opts);
    const clients = await Client.deleteMany(filters.clients, opts);

    if (deleteFreelancerUser) {
      await User.deleteOne({ _id: freelancerId, role: "freelancer" }, opts);
    }

    return {
      clients: clients.deletedCount || 0,
      projects: projects.deletedCount || 0,
      invoices: invoices.deletedCount || 0,
      payments: payments.deletedCount || 0,
      files: files.deletedCount || 0,
      messages: messages.deletedCount || 0,
    };
  };

  let counts: Awaited<ReturnType<typeof run>> | null = null;
  let session: mongoose.ClientSession | null = null;

  try {
    session = await mongoose.startSession();
    await session.withTransaction(async () => {
      counts = await run(session as mongoose.ClientSession);
    });
  } catch (error) {
    // Servers without transaction support reject the very first
    // statement of the transaction. Any other failure is a real error:
    // the transaction has rolled back, so nothing was deleted - report it.
    if (progressed && !transactionsUnsupported(error)) throw error;
    // Nothing was changed, so it is safe to run the same ordered
    // deletion without a transaction.
    counts = await run();
  } finally {
    await session?.endSession().catch(() => undefined);
  }

  if (!counts) {
    throw new Error("Cascade deletion did not complete.");
  }

  // ---------- 3. Physical files, only after the database succeeded ----------
  const filesRemovedFromDisk = await removePhysicalFiles(fileNames);

  return { ...(counts as Awaited<ReturnType<typeof run>>), filesRemovedFromDisk };
}

/** Deletes ONE client relationship owned by this freelancer + its data. */
export function deleteClientRelationship(freelancerId: Id, clientId: Id) {
  return cascade({ freelancerId, clientId, deleteFreelancerUser: false });
}

/** Deletes a freelancer account and everything that freelancer owns. */
export function deleteFreelancerAccount(freelancerId: Id) {
  return cascade({ freelancerId, clientId: null, deleteFreelancerUser: true });
}
