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

type Payment = {
  _id: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  status: string;
  invoice?: { _id: string; invoiceNumber: string };
  freelancer?: { _id: string; name: string };
  project?: { name: string };
  // Totals of the whole invoice, calculated by the server:
  invoiceAmount: number;
  paidAmount: number;
  pendingAmount: number;
  // Remaining budget of the project this payment belongs to
  projectPendingAmount: number;
};

export default function ClientPaymentsPage() {
  const { items: payments, loading, error, reload } = useApiList<Payment>(
    "/api/payments",
    "payments"
  );

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [freelancer, setFreelancer] = useState("All");

  const freelancers = [
    ...new Map(
      payments
        .filter((payment) => payment.freelancer)
        .map((payment) => [payment.freelancer!._id, payment.freelancer!.name])
    ),
  ];

  const scoped = payments.filter(
    (payment) => freelancer === "All" || payment.freelancer?._id === freelancer
  );

  const visible = scoped.filter(
    (payment) =>
      `${payment.invoice?.invoiceNumber} ${payment.freelancer?.name} ${payment.project?.name} ${payment.paymentMethod}`
        .toLowerCase()
        .includes(search.toLowerCase()) &&
      (status === "All" || payment.status === status)
  );

  const completed = scoped
    .filter((payment) => payment.status === "Completed")
    .reduce((sum, payment) => sum + payment.amount, 0);

  const awaiting = scoped
    .filter((payment) => payment.status === "Pending")
    .reduce((sum, payment) => sum + payment.amount, 0);

  return (
    <div className="p-4 md:p-8">
      <PageHeader
        title="Payment History"
        subtitle="Payments recorded against your invoices."
      />

      <ErrorBanner message={error} onRetry={reload} />

      <div className="mb-8 grid gap-5 sm:grid-cols-3">
        <StatCard title="Transactions" value={loading ? "..." : scoped.length} />
        <StatCard title="Total Paid" value={loading ? "..." : formatCurrency(completed)} hint="Completed payments" />
        <StatCard title="Awaiting Confirmation" value={loading ? "..." : formatCurrency(awaiting)} hint="Payments marked pending" />
      </div>

      <div className="mb-6 flex flex-col gap-4 md:flex-row">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search invoice, project, freelancer or method..."
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
          <option>Completed</option>
          <option>Pending</option>
        </select>
      </div>

      <Card>
        {loading ? (
          <LoadingState label="Loading payments..." />
        ) : visible.length === 0 ? (
          <EmptyState
            message={
              payments.length === 0
                ? "No payments recorded."
                : "No payments match your filters."
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-white/10 bg-white/5">
                <tr>
                  {["Payment", "Freelancer", "Project", "Invoice Amount", "Paid", "Project Pending", "Date", "Method", "Status"].map(
                    (heading) => (
                      <th key={heading} className={thClass}>
                        {heading}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {visible.map((payment) => (
                  <tr
                    key={payment._id}
                    className="border-b border-white/5 last:border-0 hover:bg-white/5"
                  >
                    <td className={tdClass}>
                      <p className="font-medium">{formatCurrency(payment.amount)}</p>
                      <p className="mt-1 text-xs text-gray-500">
                        {payment.invoice?.invoiceNumber || "-"}
                      </p>
                    </td>
                    <td className={`${tdClass} text-gray-300`}>{payment.freelancer?.name || "-"}</td>
                    <td className={`${tdClass} text-gray-300`}>{payment.project?.name || "-"}</td>
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
    </div>
  );
}
