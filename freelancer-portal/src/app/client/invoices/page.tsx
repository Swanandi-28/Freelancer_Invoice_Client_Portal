"use client";

import { useState } from "react";

import { useApiList } from "@/components/useApiList";
import {
  Card,
  EmptyState,
  ErrorBanner,
  LoadingState,
  PageHeader,
  StatCard,
  StatusBadge,
  formatCurrency,
  formatDate,
  inputClass,
  tdClass,
  thClass,
} from "@/components/ui";

type Invoice = {
  _id: string;
  invoiceNumber: string;
  // amount / paidAmount / pendingAmount / status come from the server
  amount: number;
  paidAmount: number;
  pendingAmount: number;
  // Remaining budget of the project this invoice belongs to
  projectPendingAmount: number;
  issueDate: string;
  dueDate: string;
  status: string;
  project?: { name: string };
  freelancer?: { _id: string; name: string };
};

export default function ClientInvoicesPage() {
  const { items: invoices, loading, error, reload } = useApiList<Invoice>(
    "/api/invoices",
    "invoices"
  );

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [freelancer, setFreelancer] = useState("All");

  const freelancers = [
    ...new Map(
      invoices
        .filter((invoice) => invoice.freelancer)
        .map((invoice) => [invoice.freelancer!._id, invoice.freelancer!.name])
    ),
  ];

  const scoped = invoices.filter(
    (invoice) => freelancer === "All" || invoice.freelancer?._id === freelancer
  );

  const visible = scoped.filter(
    (invoice) =>
      `${invoice.invoiceNumber} ${invoice.project?.name} ${invoice.freelancer?.name}`
        .toLowerCase()
        .includes(search.toLowerCase()) &&
      (status === "All" || invoice.status === status)
  );

  const total = (field: "amount" | "paidAmount" | "pendingAmount") =>
    scoped.reduce((sum, invoice) => sum + invoice[field], 0);

  return (
    <div className="p-4 md:p-8">
      <PageHeader
        title="My Invoices"
        subtitle="Invoices from the freelancers you work with."
      />

      <ErrorBanner message={error} onRetry={reload} />

      <div className="mb-8 grid gap-5 sm:grid-cols-3">
        <StatCard title="Total Invoiced" value={loading ? "..." : formatCurrency(total("amount"))} />
        <StatCard title="Paid" value={loading ? "..." : formatCurrency(total("paidAmount"))} />
        <StatCard title="Invoice Balance Due" value={loading ? "..." : formatCurrency(total("pendingAmount"))} />
      </div>

      <div className="mb-6 flex flex-col gap-4 md:flex-row">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search invoice, project or freelancer..."
          className={`${inputClass} flex-1`}
        />
        <select
          value={freelancer}
          onChange={(event) => setFreelancer(event.target.value)}
          className={`${inputClass} md:w-56`}
        >
          <option value="All">All Freelancers</option>
          {freelancers.map(([id, name]) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className={`${inputClass} md:w-44`}
        >
          <option value="All">All Status</option>
          <option>Pending</option>
          <option>Paid</option>
          <option>Overdue</option>
        </select>
      </div>

      <Card>
        {loading ? (
          <LoadingState label="Loading invoices..." />
        ) : visible.length === 0 ? (
          <EmptyState
            message={
              invoices.length === 0
                ? "No invoices found."
                : "No invoices match your filters."
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-white/10 bg-white/5">
                <tr>
                  {["Invoice", "Freelancer", "Project", "Amount", "Paid", "Project Pending", "Issue Date", "Due Date", "Status"].map(
                    (heading) => (
                      <th key={heading} className={thClass}>
                        {heading}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {visible.map((invoice) => (
                  <tr
                    key={invoice._id}
                    className="border-b border-white/5 last:border-0 hover:bg-white/5"
                  >
                    <td className={`${tdClass} font-medium`}>{invoice.invoiceNumber}</td>
                    <td className={`${tdClass} text-gray-300`}>{invoice.freelancer?.name || "-"}</td>
                    <td className={`${tdClass} text-gray-300`}>{invoice.project?.name || "-"}</td>
                    <td className={tdClass}>{formatCurrency(invoice.amount)}</td>
                    <td className={`${tdClass} text-green-400`}>{formatCurrency(invoice.paidAmount)}</td>
                    <td className={`${tdClass} text-yellow-400`}>{formatCurrency(invoice.projectPendingAmount)}</td>
                    <td className={`${tdClass} text-gray-400`}>{formatDate(invoice.issueDate)}</td>
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

      <p className="mt-4 text-xs text-gray-500">
        Payments are recorded by your freelancer once they receive them. Project
        Pending = project budget − all completed payments for that project, so an
        invoice can be Paid while its project still has an amount pending.
      </p>
    </div>
  );
}
