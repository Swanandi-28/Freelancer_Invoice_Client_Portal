"use client";

import { useState } from "react";

import ConfirmDialog from "@/components/ConfirmDialog";
import { useApiList } from "@/components/useApiList";
import {
  Card,
  EmptyState,
  ErrorBanner,
  LoadingState,
  PageHeader,
  StatCard,
  tdClass,
  thClass,
} from "@/components/ui";

type Freelancer = {
  _id: string;
  name: string;
  email: string;
  clientCount: number;
  projectCount: number;
  invoiceCount: number;
};

/*
  Administrator page: list freelancers and delete a freelancer account
  together with everything that freelancer owns. Only administrators can
  open it (checked by the server on every request).
*/
export default function AdminFreelancersPage() {
  const {
    items: freelancers,
    loading,
    error,
    reload,
  } = useApiList<Freelancer>("/api/admin/freelancers", "freelancers");

  const [target, setTarget] = useState<Freelancer | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [notice, setNotice] = useState("");

  const handleDelete = async () => {
    if (!target) return;

    try {
      setDeleting(true);
      setDeleteError("");

      const response = await fetch(`/api/admin/freelancers/${target._id}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (!response.ok) {
        setDeleteError(data.message || "Failed to delete freelancer.");
        return;
      }

      setNotice(data.message || "Freelancer deleted.");
      setTarget(null);
      await reload();
    } catch {
      setDeleteError("Unable to connect to the server.");
    } finally {
      setDeleting(false);
    }
  };

  const total = (field: "clientCount" | "projectCount" | "invoiceCount") =>
    freelancers.reduce((sum, freelancer) => sum + freelancer[field], 0);

  return (
    <div className="p-4 md:p-8">
      <PageHeader
        title="Freelancers"
        subtitle="Administrator view of every freelancer account."
      />

      <ErrorBanner message={error} onRetry={reload} />

      {notice && (
        <div className="mb-6 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-400">
          {notice}
        </div>
      )}

      <div className="mb-8 grid gap-5 sm:grid-cols-3">
        <StatCard title="Freelancers" value={loading ? "..." : freelancers.length} />
        <StatCard title="Client Relationships" value={loading ? "..." : total("clientCount")} />
        <StatCard title="Projects" value={loading ? "..." : total("projectCount")} />
      </div>

      <Card title="All Freelancers">
        {loading ? (
          <LoadingState label="Loading freelancers..." />
        ) : freelancers.length === 0 ? (
          <EmptyState message="No freelancers found." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-white/10">
                <tr>
                  {["Freelancer", "Email", "Clients", "Projects", "Invoices", "Actions"].map(
                    (heading) => (
                      <th key={heading} className={thClass}>
                        {heading}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {freelancers.map((freelancer) => (
                  <tr key={freelancer._id} className="border-b border-white/5 last:border-0">
                    <td className={`${tdClass} font-medium`}>{freelancer.name}</td>
                    <td className={`${tdClass} text-gray-400`}>{freelancer.email}</td>
                    <td className={tdClass}>{freelancer.clientCount}</td>
                    <td className={tdClass}>{freelancer.projectCount}</td>
                    <td className={tdClass}>{freelancer.invoiceCount}</td>
                    <td className={tdClass}>
                      <button
                        onClick={() => {
                          setDeleteError("");
                          setNotice("");
                          setTarget(freelancer);
                        }}
                        className="rounded-lg border border-red-500/30 px-3 py-1.5 text-xs text-red-400 transition hover:bg-red-500/10"
                      >
                        Delete Freelancer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {target && (
        <ConfirmDialog
          title="Delete Freelancer"
          confirmLabel="Delete Freelancer"
          busy={deleting}
          error={deleteError}
          onCancel={() => setTarget(null)}
          onConfirm={handleDelete}
        >
          <p>Are you sure you want to delete:</p>
          <p className="mt-2 font-semibold text-white">
            {target.name}{" "}
            <span className="font-normal text-gray-400">({target.email})</span>
          </p>
          <p className="mt-4">This will permanently remove:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>The freelancer&apos;s account</li>
            <li>{target.clientCount} client relationship(s)</li>
            <li>{target.projectCount} project(s)</li>
            <li>{target.invoiceCount} invoice(s) and their payments</li>
            <li>All of their files and messages</li>
          </ul>
          <p className="mt-4 text-gray-400">
            Clients&apos; login accounts will NOT be deleted, and other
            freelancers are not affected. This action cannot be undone.
          </p>
        </ConfirmDialog>
      )}
    </div>
  );
}
