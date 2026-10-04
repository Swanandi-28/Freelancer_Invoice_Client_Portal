"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import ChatThread from "@/components/ChatThread";
import {
  Card,
  EmptyState,
  LoadingState,
  StatCard,
  StatusBadge,
  formatCurrency,
  formatDate,
  formatFileSize,
  tdClass,
  thClass,
} from "@/components/ui";

type Project = {
  _id: string;
  name: string;
  description?: string;
  budget: number;
  // Project level, from the server:
  // pendingAmount = budget - completed payments of this project
  paidAmount: number;
  pendingAmount: number;
  deadline: string;
  status: string;
};

type Invoice = {
  _id: string;
  invoiceNumber: string;
  amount: number;
  paidAmount: number;
  pendingAmount: number;
  // Remaining budget of the project this invoice belongs to
  projectPendingAmount: number;
  dueDate: string;
  status: string;
  project?: { name: string };
};

type Payment = {
  _id: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  status: string;
  invoice?: { invoiceNumber: string };
  project?: { name: string };
  invoiceAmount: number;
  paidAmount: number;
  pendingAmount: number;
  projectPendingAmount: number;
};

type PortalFile = {
  _id: string;
  originalName: string;
  fileSize: number;
  createdAt: string;
  downloadUrl: string;
  project?: { name: string };
};

type WorkspaceData = {
  freelancer: { _id: string; name: string; email: string };
  client: { id: string; name: string; company: string; email: string };
  stats: {
    totalProjects: number;
    activeProjects: number;
    totalInvoiced: number;
    totalBudget: number;
    totalPaid: number;
    pendingAmount: number;
    unreadMessages: number;
  };
  projects: Project[];
  invoices: Invoice[];
  payments: Payment[];
  files: PortalFile[];
};

/*
  A workspace = the logged-in client + ONE freelancer.
  The id in the URL only selects the workspace; the server verifies
  that this client really has that relationship before returning data.
*/
function Workspace() {
  const searchParams = useSearchParams();
  const freelancerId = searchParams.get("freelancer") || "";

  const [data, setData] = useState<WorkspaceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadWorkspace = useCallback(async () => {
    if (!freelancerId) {
      setError("No freelancer selected.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `/api/client/workspace?freelancerId=${encodeURIComponent(freelancerId)}`,
        { cache: "no-store" }
      );
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to load workspace.");
      }

      setData(result);
    } catch (reason) {
      setData(null);
      setError(
        reason instanceof Error ? reason.message : "Unable to load workspace."
      );
    } finally {
      setLoading(false);
    }
  }, [freelancerId]);

  useEffect(() => {
    loadWorkspace();
  }, [loadWorkspace]);

  if (loading) {
    return (
      <div className="p-4 md:p-8">
        <LoadingState label="Loading workspace..." />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-4 md:p-8">
        <div className="mx-auto max-w-2xl rounded-xl border border-red-500/20 bg-red-500/10 p-8 text-center">
          <div className="text-4xl">🔒</div>
          <h1 className="mt-4 text-xl font-semibold">Workspace unavailable</h1>
          <p className="mt-2 text-sm text-red-300">
            {error || "Unable to load workspace."}
          </p>
          <Link
            href="/client/dashboard"
            className="mt-6 inline-block rounded-lg bg-blue-600 px-5 py-3 text-sm font-medium hover:bg-blue-500"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-4 md:p-8">
      <Link
        href="/client/dashboard"
        className="text-sm text-blue-400 hover:text-blue-300"
      >
        ← Back to Dashboard
      </Link>

      {/* HEADER */}
      <div className="rounded-2xl border border-white/10 bg-[#111827] p-6">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-500/10 text-xl font-bold text-blue-400">
              {data.freelancer.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm text-gray-500">Private Workspace</p>
              <h1 className="text-2xl font-bold">{data.freelancer.name}</h1>
              <p className="mt-1 text-sm text-gray-400">
                {data.freelancer.email}
              </p>
            </div>
          </div>
          <div className="text-sm text-gray-400 md:text-right">
            <p className="text-gray-500">Your account with this freelancer</p>
            <p className="mt-1 font-medium text-gray-200">
              {data.client.company}
            </p>
          </div>
        </div>
      </div>

      {/* SUMMARY */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Projects"
          value={data.stats.totalProjects}
          hint={`${data.stats.activeProjects} in progress`}
        />
        <StatCard title="Total Budget" value={formatCurrency(data.stats.totalBudget)} />
        <StatCard title="Total Paid" value={formatCurrency(data.stats.totalPaid)} />
        <StatCard
          title="Pending"
          value={formatCurrency(data.stats.pendingAmount)}
          hint="Project budgets − completed payments"
        />
      </div>

      {/* PROJECTS */}
      <Card title="Projects">
        {data.projects.length === 0 ? (
          <EmptyState message="No projects found." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-white/10">
                <tr>
                  {["Project", "Budget", "Paid", "Pending", "Deadline", "Status"].map((heading) => (
                    <th key={heading} className={thClass}>
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.projects.map((project) => (
                  <tr key={project._id} className="border-b border-white/5 last:border-0">
                    <td className="px-5 py-4 text-sm">
                      <p className="font-medium">{project.name}</p>
                      <p className="mt-1 text-xs text-gray-500">
                        {project.description || "No description"}
                      </p>
                    </td>
                    <td className={tdClass}>{formatCurrency(project.budget)}</td>
                    <td className={`${tdClass} text-green-400`}>{formatCurrency(project.paidAmount)}</td>
                    <td className={`${tdClass} text-yellow-400`}>{formatCurrency(project.pendingAmount)}</td>
                    <td className={`${tdClass} text-gray-400`}>{formatDate(project.deadline)}</td>
                    <td className={tdClass}>
                      <StatusBadge status={project.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* INVOICES */}
      <Card title="Invoices">
        {data.invoices.length === 0 ? (
          <EmptyState message="No invoices found." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-white/10">
                <tr>
                  {["Invoice", "Project", "Amount", "Paid", "Project Pending", "Due Date", "Status"].map(
                    (heading) => (
                      <th key={heading} className={thClass}>
                        {heading}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {data.invoices.map((invoice) => (
                  <tr key={invoice._id} className="border-b border-white/5 last:border-0">
                    <td className={`${tdClass} font-medium`}>{invoice.invoiceNumber}</td>
                    <td className={`${tdClass} text-gray-400`}>{invoice.project?.name || "-"}</td>
                    <td className={tdClass}>{formatCurrency(invoice.amount)}</td>
                    <td className={`${tdClass} text-green-400`}>{formatCurrency(invoice.paidAmount)}</td>
                    <td className={`${tdClass} text-yellow-400`}>{formatCurrency(invoice.projectPendingAmount)}</td>
                    <td className={`${tdClass} text-gray-400`}>{formatDate(invoice.dueDate)}</td>
                    <td className={tdClass}>
                      <StatusBadge status={invoice.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* PAYMENTS */}
      <Card title="Payment History">
        {data.payments.length === 0 ? (
          <EmptyState message="No payments recorded." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-white/10">
                <tr>
                  {["Payment", "Invoice", "Project", "Invoice Amount", "Paid", "Project Pending", "Date", "Method", "Status"].map(
                    (heading) => (
                      <th key={heading} className={thClass}>
                        {heading}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {data.payments.map((payment) => (
                  <tr key={payment._id} className="border-b border-white/5 last:border-0">
                    <td className={`${tdClass} font-medium`}>{formatCurrency(payment.amount)}</td>
                    <td className={tdClass}>{payment.invoice?.invoiceNumber || "-"}</td>
                    <td className={`${tdClass} text-gray-400`}>{payment.project?.name || "-"}</td>
                    <td className={tdClass}>{formatCurrency(payment.invoiceAmount)}</td>
                    <td className={`${tdClass} text-green-400`}>{formatCurrency(payment.paidAmount)}</td>
                    <td className={`${tdClass} text-yellow-400`}>{formatCurrency(payment.projectPendingAmount)}</td>
                    <td className={`${tdClass} text-gray-400`}>{formatDate(payment.paymentDate)}</td>
                    <td className={`${tdClass} text-gray-400`}>{payment.paymentMethod}</td>
                    <td className={tdClass}>
                      <StatusBadge status={payment.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* FILES */}
      <Card title="Files">
        {data.files.length === 0 ? (
          <EmptyState message="No files have been shared in this workspace." />
        ) : (
          <ul className="divide-y divide-white/5">
            {data.files.map((file) => (
              <li
                key={file._id}
                className="flex flex-col justify-between gap-3 px-6 py-4 sm:flex-row sm:items-center"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{file.originalName}</p>
                  <p className="mt-1 text-xs text-gray-500">
                    {file.project?.name || "Project"} · {formatFileSize(file.fileSize)} ·{" "}
                    {formatDate(file.createdAt)}
                  </p>
                </div>
                <a
                  href={file.downloadUrl}
                  className="shrink-0 rounded-lg bg-white/5 px-4 py-2 text-center text-sm font-medium text-blue-400 hover:bg-white/10"
                >
                  Download
                </a>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* MESSAGES */}
      <Card title={`Messages with ${data.freelancer.name}`}>
        <ChatThread
          clientId={data.client.id}
          viewerRole="client"
          projects={data.projects.map((project) => ({
            _id: project._id,
            name: project.name,
          }))}
        />
      </Card>
    </div>
  );
}

export default function ClientWorkspacePage() {
  // useSearchParams() must be inside a Suspense boundary for production builds.
  return (
    <Suspense
      fallback={
        <div className="p-4 md:p-8">
          <LoadingState label="Loading workspace..." />
        </div>
      }
    >
      <Workspace />
    </Suspense>
  );
}
