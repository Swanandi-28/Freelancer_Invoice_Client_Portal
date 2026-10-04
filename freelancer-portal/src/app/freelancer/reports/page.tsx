"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type ReportData = {
  summary: {
    totalClients: number;
    totalProjects: number;
    activeProjects: number;
    completedProjects: number;
    totalProjectBudget: number;
    uninvoicedBudget: number;
    overdueAmount: number;
    totalInvoicedAmount: number;
    paidInvoiceAmount: number;
    pendingAmount: number;
    totalRevenue: number;
    pendingPaymentAmount: number;
  };

  monthlyRevenue: {
    month: string;
    revenue: number;
  }[];

  projectPerformance: {
    id: string;
    name: string;
    budget: number;
    invoiced: number;
    paid: number;
    pending: number;
    status: string;
    client: string;
  }[];

  invoiceBreakdown: {
    Draft: number;
    Pending: number;
    Paid: number;
    Overdue: number;
  };

  paymentMethods: {
    method: string;
    amount: number;
  }[];
};

const formatCurrency = (amount: number) => {
  return `₹${amount.toLocaleString("en-IN")}`;
};

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadReports = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/reports/freelancer", {
          method: "GET",
          credentials: "include",
        });

        const result = await response.json();

        if (!response.ok) {
          setError(result.message || "Failed to load reports.");
          return;
        }

        setData(result);
      } catch (error) {
        console.error(error);
        setError("Unable to connect to the server.");
      } finally {
        setLoading(false);
      }
    };

    loadReports();
  }, []);

  const maxRevenue = useMemo(() => {
    if (!data || data.monthlyRevenue.length === 0) {
      return 1;
    }

    return Math.max(
      ...data.monthlyRevenue.map((item) => item.revenue),
      1
    );
  }, [data]);

  const totalInvoiceStatuses = useMemo(() => {
    if (!data) return 0;

    return Object.values(data.invoiceBreakdown).reduce(
      (total, value) => total + value,
      0
    );
  }, [data]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
    } finally {
      window.location.href = "/login";
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading reports...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-[60vh] text-white flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-[#111827] border border-white/10 rounded-2xl p-8 text-center">
          <div className="text-4xl mb-4">⚠️</div>

          <h1 className="text-xl font-semibold mb-2">
            Unable to load reports
          </h1>

          <p className="text-gray-400 mb-6">
            {error || "No report data available."}
          </p>

          <button
            onClick={() => window.location.reload()}
            className="px-5 py-3 bg-white text-black rounded-xl font-medium hover:bg-gray-200"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* TOP NAVBAR */}

      {/* SIDEBAR */}

      {/* MAIN CONTENT */}
      <div>
        <div className="p-6 md:p-8 max-w-7xl mx-auto">
          {/* HEADER */}
          <div className="mb-8">
            <p className="text-sm text-gray-500 mb-2">
              Freelancer Analytics
            </p>

            <h1 className="text-3xl md:text-4xl font-bold">
              Reports & Analytics
            </h1>

            <p className="text-gray-400 mt-2">
              View your business performance using real-time data.
            </p>
          </div>

          {/* SUMMARY CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Revenue */}
            <div className="bg-[#111827] border border-white/10 rounded-2xl p-5">
              <div className="text-2xl mb-3">💰</div>

              <p className="text-sm text-gray-500">
                Total Revenue
              </p>

              <p className="text-2xl font-bold mt-1">
                {formatCurrency(data.summary.totalRevenue)}
              </p>

              <p className="text-xs text-green-400 mt-2">
                From completed payments
              </p>
            </div>

            {/* Invoiced */}
            <div className="bg-[#111827] border border-white/10 rounded-2xl p-5">
              <div className="text-2xl mb-3">🧾</div>

              <p className="text-sm text-gray-500">
                Total Invoiced
              </p>

              <p className="text-2xl font-bold mt-1">
                {formatCurrency(
                  data.summary.totalInvoicedAmount
                )}
              </p>

              <p className="text-xs text-gray-500 mt-2">
                Across all active invoices
              </p>
            </div>

            {/* Pending */}
            <div className="bg-[#111827] border border-white/10 rounded-2xl p-5">
              <div className="text-2xl mb-3">⏳</div>

              <p className="text-sm text-gray-500">
                Pending Invoice Amount
              </p>

              <p className="text-2xl font-bold mt-1">
                {formatCurrency(
                  data.summary.pendingAmount
                )}
              </p>

              <p className="text-xs text-yellow-400 mt-2">
                Invoice amounts − completed payments
              </p>
            </div>

            {/* Projects */}
            <div className="bg-[#111827] border border-white/10 rounded-2xl p-5">
              <div className="text-2xl mb-3">📁</div>

              <p className="text-sm text-gray-500">
                Total Projects
              </p>

              <p className="text-2xl font-bold mt-1">
                {data.summary.totalProjects}
              </p>

              <p className="text-xs text-gray-500 mt-2">
                {data.summary.activeProjects} active ·{" "}
                {data.summary.completedProjects} completed
              </p>
            </div>
          </div>

          {/* REVENUE CHART */}
          <section className="bg-[#111827] border border-white/10 rounded-2xl p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold">
                  Revenue Overview
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  Revenue from completed payments
                </p>
              </div>

              <span className="text-sm text-gray-400">
                Last 6 months
              </span>
            </div>

            {data.monthlyRevenue.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-gray-500">
                No payment data available yet.
              </div>
            ) : (
              <div className="h-64 flex items-end gap-4 md:gap-8 border-b border-white/10 px-2">
                {data.monthlyRevenue.map((item) => {
                  const height =
                    Math.max(
                      (item.revenue / maxRevenue) * 100,
                      5
                    );

                  return (
                    <div
                      key={item.month}
                      className="flex-1 h-full flex flex-col justify-end items-center gap-3"
                    >
                      <span className="text-xs text-gray-400">
                        {formatCurrency(item.revenue)}
                      </span>

                      <div
                        className="w-full max-w-16 bg-white/20 hover:bg-white/30 rounded-t-lg transition-all"
                        style={{
                          height: `${height}%`,
                        }}
                        title={`${item.month}: ${formatCurrency(
                          item.revenue
                        )}`}
                      />

                      <span className="text-xs text-gray-500">
                        {item.month}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* TWO COLUMN SECTION */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* INVOICE BREAKDOWN */}
            <section className="bg-[#111827] border border-white/10 rounded-2xl p-6">
              <div className="mb-6">
                <h2 className="text-lg font-semibold">
                  Invoice Breakdown
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  Current invoice statuses
                </p>
              </div>

              {totalInvoiceStatuses === 0 ? (
                <div className="py-12 text-center text-gray-500">
                  No invoices available.
                </div>
              ) : (
                <div className="space-y-5">
                  {[
                    {
                      label: "Paid",
                      value: data.invoiceBreakdown.Paid,
                    },
                    {
                      label: "Pending",
                      value: data.invoiceBreakdown.Pending,
                    },
                    {
                      label: "Overdue",
                      value: data.invoiceBreakdown.Overdue,
                    },
                    {
                      label: "Draft",
                      value: data.invoiceBreakdown.Draft,
                    },
                  ].map((item) => {
                    const percentage =
                      (item.value / totalInvoiceStatuses) * 100;

                    return (
                      <div key={item.label}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-300">
                            {item.label}
                          </span>

                          <span className="text-sm text-gray-500">
                            {item.value} (
                            {percentage.toFixed(0)}%)
                          </span>
                        </div>

                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-white/50 rounded-full"
                            style={{
                              width: `${percentage}%`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* PAYMENT METHODS */}
            <section className="bg-[#111827] border border-white/10 rounded-2xl p-6">
              <div className="mb-6">
                <h2 className="text-lg font-semibold">
                  Payment Methods
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  Completed payment distribution
                </p>
              </div>

              {data.paymentMethods.length === 0 ? (
                <div className="py-12 text-center text-gray-500">
                  No completed payments available.
                </div>
              ) : (
                <div className="space-y-4">
                  {data.paymentMethods.map((item) => {
                    const total = data.summary.totalRevenue || 1;

                    const percentage =
                      (item.amount / total) * 100;

                    return (
                      <div key={item.method}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-300">
                            {item.method}
                          </span>

                          <span className="text-sm font-medium">
                            {formatCurrency(item.amount)}
                          </span>
                        </div>

                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-white/40 rounded-full"
                            style={{
                              width: `${Math.min(
                                percentage,
                                100
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          {/* PROJECT PERFORMANCE */}
          <section className="bg-[#111827] border border-white/10 rounded-2xl overflow-hidden mb-8">
            <div className="p-6 border-b border-white/10">
              <h2 className="text-lg font-semibold">
                Project Performance
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                Overview of your projects and budgets
              </p>
            </div>

            {data.projectPerformance.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                No projects available.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10 text-left">
                      <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase">
                        Project
                      </th>

                      <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase">
                        Client
                      </th>

                      <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase">Budget</th>
                      <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase">Invoiced</th>
                      <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase">Paid</th>
                      <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase">Pending</th>

                      <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {data.projectPerformance.map(
                      (project) => (
                        <tr
                          key={project.id}
                          className="border-b border-white/5 hover:bg-white/[0.02]"
                        >
                          <td className="px-6 py-4">
                            <p className="font-medium">
                              {project.name}
                            </p>
                          </td>

                          <td className="px-6 py-4 text-gray-400">
                            {project.client}
                          </td>

                          <td className="px-6 py-4">
                            {formatCurrency(project.budget)}
                          </td>

                          <td className="px-6 py-4">
                            {formatCurrency(project.invoiced)}
                          </td>

                          <td className="px-6 py-4 text-green-400">
                            {formatCurrency(project.paid)}
                          </td>

                          <td className="px-6 py-4 text-yellow-400">
                            {formatCurrency(project.pending)}
                          </td>

                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex px-3 py-1 rounded-full text-xs ${
                                project.status ===
                                "Completed"
                                  ? "bg-green-500/10 text-green-400"
                                  : project.status ===
                                    "In Progress"
                                  ? "bg-blue-500/10 text-blue-400"
                                  : "bg-yellow-500/10 text-yellow-400"
                              }`}
                            >
                              {project.status}
                            </span>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* BUSINESS SUMMARY */}
          <section className="bg-[#111827] border border-white/10 rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-6">
              Business Summary
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-gray-500">
                  Clients
                </p>

                <p className="text-xl font-semibold mt-1">
                  {data.summary.totalClients}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">
                  Paid on Invoices
                </p>

                <p className="text-xl font-semibold mt-1">
                  {formatCurrency(
                    data.summary.paidInvoiceAmount
                  )}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">
                  Payments Awaiting Confirmation
                </p>

                <p className="text-xl font-semibold mt-1">
                  {formatCurrency(
                    data.summary.pendingPaymentAmount
                  )}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">
                  Total Project Budget
                </p>

                <p className="text-xl font-semibold mt-1">
                  {formatCurrency(data.summary.totalProjectBudget)}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">
                  Budget Not Yet Invoiced
                </p>

                <p className="text-xl font-semibold mt-1">
                  {formatCurrency(data.summary.uninvoicedBudget)}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">
                  Overdue Amount
                </p>

                <p className="text-xl font-semibold mt-1">
                  {formatCurrency(data.summary.overdueAmount)}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">
                  Completed Projects
                </p>

                <p className="text-xl font-semibold mt-1">
                  {data.summary.completedProjects}
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}