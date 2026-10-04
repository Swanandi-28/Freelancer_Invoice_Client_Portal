"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Freelancer = {
  id: string;
  freelancer: {
    id?: string;
    name: string;
    email: string;
  } | null;
  company: string;
  clientName: string;
  email: string;
  projectCount?: number;
  projects?: string[];
  pendingAmount?: number;
  paidAmount?: number;
};

type Project = {
  id: string;
  name: string;
  description: string;
  budget: number;
  paidAmount: number;
  pendingAmount: number;
  deadline: string;
  status: string;
  freelancer: string;
};

type Invoice = {
  id: string;
  invoiceNumber: string;
  amount: number;
  paidAmount: number;
  pendingAmount: number;
  projectPendingAmount: number;
  issueDate: string;
  dueDate: string;
  status: string;
  project: string;
  freelancer: string;
};

type Payment = {
  id: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  status: string;
  project: string;
  invoice: string;
};

type DashboardData = {
  client: {
    name: string;
    email: string;
  };

  stats: {
    totalFreelancers: number;
    activeProjects: number;
    pendingInvoices: number;
    pendingAmount: number;
    totalPaid: number;
  };

  freelancers: Freelancer[];
  recentProjects: Project[];
  recentInvoices: Invoice[];
  recentPayments: Payment[];
};

export default function ClientDashboard() {
  const router = useRouter();

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // --------------------------------------------------
  // LOAD CLIENT DASHBOARD
  // --------------------------------------------------

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      /*
       * First synchronize the existing Client records
       * with the currently logged-in client's User account.
       *
       * Example:
       *
       * Freelancer created:
       * Aishwarya - aishwarya@gmail.com
       *
       * Aishwarya later registers with:
       * aishwarya@gmail.com
       *
       * This connects both records.
       */
      await fetch("/api/client/sync", {
        method: "POST",
      });

      // Now load the actual dashboard data.
      const response = await fetch(
        "/api/dashboard/client",
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          router.push("/login");
          return;
        }

        throw new Error(
          result.message ||
            "Failed to load dashboard."
        );
      }

      setData(result);
    } catch (error) {
      console.error(
        "Client dashboard error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load dashboard."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  // --------------------------------------------------
  // LOGOUT
  // --------------------------------------------------

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
    } catch (error) {
      console.error("Logout error:", error);
    }

    router.push("/login");
  };

  // --------------------------------------------------
  // FORMAT CURRENCY
  // --------------------------------------------------

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // --------------------------------------------------
  // FORMAT DATE
  // --------------------------------------------------

  const formatDate = (date: string) => {
    if (!date) return "-";

    return new Date(date).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  // --------------------------------------------------
  // STATUS STYLE
  // --------------------------------------------------

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "Paid":
      case "Completed":
        return "bg-green-500/10 text-green-400 border-green-500/20";

      case "Pending":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";

      case "Overdue":
        return "bg-red-500/10 text-red-400 border-red-500/20";

      case "In Progress":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";

      case "Draft":
        return "bg-gray-500/10 text-gray-400 border-gray-500/20";

      default:
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    }
  };

  // --------------------------------------------------
  // LOADING
  // --------------------------------------------------

  if (loading) {
    return (
      <div className="min-h-[60vh] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-gray-700 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />

          <p className="text-gray-400">
            Loading your dashboard...
          </p>
        </div>
      </div>
    );
  }

  // --------------------------------------------------
  // ERROR
  // --------------------------------------------------

  if (error) {
    return (
      <div className="min-h-[60vh] text-white flex items-center justify-center px-6">
        <div className="bg-[#111827] border border-red-500/20 rounded-2xl p-8 max-w-md w-full text-center">
          <div className="text-4xl mb-4">
            ⚠️
          </div>

          <h2 className="text-xl font-semibold mb-2">
            Unable to load dashboard
          </h2>

          <p className="text-gray-400 text-sm mb-6">
            {error}
          </p>

          <button
            onClick={loadDashboard}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-lg transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  // --------------------------------------------------
  // DASHBOARD
  // --------------------------------------------------

  return (
    <div>

      {/* TOP NAVBAR */}

      <div className="flex">

        {/* SIDEBAR */}

        {/* MAIN CONTENT */}
        <div className="flex-1 min-w-0 p-4 md:p-8 max-w-[1600px]">

          {/* WELCOME */}
          <div className="mb-8">

            <h1 className="text-3xl font-bold">
              Welcome back, {data.client.name} 👋
            </h1>

            <p className="text-gray-400 mt-2">
              Here's an overview of your freelance
              projects and payments.
            </p>

          </div>

          {/* STATS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">

            {/* FREELANCERS */}
            <div className="bg-[#111827] border border-white/10 rounded-2xl p-5">

              <div className="flex items-center justify-between">

                <div>
                  <p className="text-sm text-gray-400">
                    My Freelancers
                  </p>

                  <p className="text-3xl font-bold mt-2">
                    {data.stats.totalFreelancers}
                  </p>
                </div>

                <div className="w-11 h-11 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 text-xl">
                  👤
                </div>

              </div>
            </div>

            {/* ACTIVE PROJECTS */}
            <div className="bg-[#111827] border border-white/10 rounded-2xl p-5">

              <div className="flex items-center justify-between">

                <div>
                  <p className="text-sm text-gray-400">
                    Active Projects
                  </p>

                  <p className="text-3xl font-bold mt-2">
                    {data.stats.activeProjects}
                  </p>
                </div>

                <div className="w-11 h-11 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 text-xl">
                  📁
                </div>

              </div>
            </div>

            {/* PENDING */}
            <div className="bg-[#111827] border border-white/10 rounded-2xl p-5">

              <div className="flex items-center justify-between">

                <div>
                  <p className="text-sm text-gray-400">
                    Pending Amount
                  </p>

                  <p className="text-2xl font-bold mt-2">
                    {formatCurrency(
                      data.stats.pendingAmount
                    )}
                  </p>
                </div>

                <div className="w-11 h-11 rounded-xl bg-yellow-500/10 flex items-center justify-center text-yellow-400 text-xl">
                  ₹
                </div>

              </div>
            </div>

            {/* TOTAL PAID */}
            <div className="bg-[#111827] border border-white/10 rounded-2xl p-5">

              <div className="flex items-center justify-between">

                <div>
                  <p className="text-sm text-gray-400">
                    Total Paid
                  </p>

                  <p className="text-2xl font-bold mt-2">
                    {formatCurrency(
                      data.stats.totalPaid
                    )}
                  </p>
                </div>

                <div className="w-11 h-11 rounded-xl bg-green-500/10 flex items-center justify-center text-green-400 text-xl">
                  ✓
                </div>

              </div>
            </div>

          </div>

          {/* MY FREELANCERS */}
          <section className="mb-8">

            <div className="flex items-center justify-between mb-5">

              <div>
                <h2 className="text-xl font-semibold">
                  My Freelancers
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  Select a freelancer to view your private workspace.
                </p>
              </div>

            </div>

            {data.freelancers.length === 0 ? (

              <div className="bg-[#111827] border border-white/10 rounded-2xl p-10 text-center">

                <div className="text-4xl mb-4">
                  👤
                </div>

                <h3 className="text-lg font-semibold">
                  No freelancers yet
                </h3>

                <p className="text-gray-500 mt-2">
                  You don't have any freelancer
                  relationships connected to this account.
                </p>

              </div>

            ) : (

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">

                {data.freelancers.map(
                  (relationship) => (

                    <div
                      key={relationship.id}
                      className="bg-[#111827] border border-white/10 rounded-2xl p-6 hover:border-blue-500/40 transition"
                    >

                      <div className="flex items-start justify-between">

                        <div className="flex items-center gap-3">

                          <div className="w-12 h-12 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center text-lg font-bold">
                            {relationship.freelancer?.name
                              ?.charAt(0)
                              .toUpperCase() || "F"}
                          </div>

                          <div>

                            <h3 className="font-semibold">
                              {relationship.freelancer?.name ||
                                "Freelancer"}
                            </h3>

                            <p className="text-xs text-gray-500">
                              {relationship.freelancer?.email ||
                                ""}
                            </p>

                          </div>

                        </div>

                      </div>

                      <div className="mt-5 space-y-2">

                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">
                            Company
                          </span>

                          <span className="text-gray-300">
                            {relationship.company}
                          </span>
                        </div>

                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">
                            Client
                          </span>

                          <span className="text-gray-300">
                            {relationship.clientName}
                          </span>
                        </div>

                        <div className="flex justify-between gap-4 text-sm">
                          <span className="text-gray-500">
                            Projects
                          </span>
                          <span className="text-right text-gray-300">
                            {relationship.projects?.length
                              ? relationship.projects.join(", ")
                              : "No projects yet"}
                          </span>
                        </div>

                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">
                            Pending
                          </span>
                          <span className="text-yellow-400">
                            {formatCurrency(relationship.pendingAmount || 0)}
                          </span>
                        </div>

                      </div>

                      <button
                        onClick={() =>
                          router.push(
                            `/client/workspace?freelancer=${relationship.freelancer?.id || ""}`
                          )
                        }
                        className="w-full mt-6 px-4 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 transition font-medium"
                      >
                        Open Workspace →
                      </button>

                    </div>

                  )
                )}

              </div>

            )}

          </section>

          {/* RECENT PROJECTS + INVOICES */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">

            {/* PROJECTS */}
            <section className="bg-[#111827] border border-white/10 rounded-2xl p-6">

              <div className="flex items-center justify-between mb-5">

                <div>
                  <h2 className="text-lg font-semibold">
                    Recent Projects
                  </h2>

                  <p className="text-sm text-gray-500">
                    Your latest projects
                  </p>
                </div>

              </div>

              {data.recentProjects.length === 0 ? (

                <p className="text-gray-500 text-sm">
                  No projects available.
                </p>

              ) : (

                <div className="space-y-4">

                  {data.recentProjects.map(
                    (project) => (

                      <div
                        key={project.id}
                        className="border border-white/10 rounded-xl p-4"
                      >

                        <div className="flex justify-between gap-4">

                          <div>

                            <h3 className="font-medium">
                              {project.name}
                            </h3>

                            <p className="text-xs text-gray-500 mt-1">
                              Freelancer:{" "}
                              {project.freelancer}
                            </p>

                          </div>

                          <span
                            className={`px-2.5 py-1 rounded-full text-xs border h-fit ${getStatusStyle(
                              project.status
                            )}`}
                          >
                            {project.status}
                          </span>

                        </div>

                        <div className="flex justify-between mt-4 text-sm">

                          <span className="text-gray-500">
                            Budget
                          </span>

                          <span>
                            {formatCurrency(
                              project.budget
                            )}
                          </span>

                        </div>

                        <div className="flex justify-between mt-2 text-sm">
                          <span className="text-gray-500">Paid</span>
                          <span className="text-green-400">
                            {formatCurrency(project.paidAmount)}
                          </span>
                        </div>

                        <div className="flex justify-between mt-2 text-sm">
                          <span className="text-gray-500">Pending</span>
                          <span className="text-yellow-400">
                            {formatCurrency(project.pendingAmount)}
                          </span>
                        </div>

                        <div className="flex justify-between mt-2 text-sm">

                          <span className="text-gray-500">
                            Deadline
                          </span>

                          <span>
                            {formatDate(
                              project.deadline
                            )}
                          </span>

                        </div>

                      </div>

                    )
                  )}

                </div>

              )}

            </section>

            {/* INVOICES */}
            <section className="bg-[#111827] border border-white/10 rounded-2xl p-6">

              <div className="flex items-center justify-between mb-5">

                <div>
                  <h2 className="text-lg font-semibold">
                    Recent Invoices
                  </h2>

                  <p className="text-sm text-gray-500">
                    Your latest invoices
                  </p>
                </div>

              </div>

              {data.recentInvoices.length === 0 ? (

                <p className="text-gray-500 text-sm">
                  No invoices available.
                </p>

              ) : (

                <div className="space-y-4">

                  {data.recentInvoices.map(
                    (invoice) => (

                      <div
                        key={invoice.id}
                        className="border border-white/10 rounded-xl p-4"
                      >

                        <div className="flex justify-between gap-4">

                          <div>

                            <h3 className="font-medium">
                              {invoice.invoiceNumber}
                            </h3>

                            <p className="text-xs text-gray-500 mt-1">
                              {invoice.project}
                            </p>

                          </div>

                          <span
                            className={`px-2.5 py-1 rounded-full text-xs border h-fit ${getStatusStyle(
                              invoice.status
                            )}`}
                          >
                            {invoice.status}
                          </span>

                        </div>

                        <div className="flex justify-between mt-4 text-sm">

                          <span className="text-gray-500">
                            Amount
                          </span>

                          <span className="font-medium">
                            {formatCurrency(invoice.amount)}
                          </span>

                        </div>

                        <div className="flex justify-between mt-2 text-sm">
                          <span className="text-gray-500">Paid</span>
                          <span className="text-green-400">
                            {formatCurrency(invoice.paidAmount)}
                          </span>
                        </div>

                        <div className="flex justify-between mt-2 text-sm">
                          <span className="text-gray-500">Project Pending</span>
                          <span className="text-yellow-400">
                            {formatCurrency(invoice.projectPendingAmount)}
                          </span>
                        </div>

                        <div className="flex justify-between mt-2 text-sm">

                          <span className="text-gray-500">
                            Due Date
                          </span>

                          <span>
                            {formatDate(
                              invoice.dueDate
                            )}
                          </span>

                        </div>

                      </div>

                    )
                  )}

                </div>

              )}

            </section>

          </div>

          {/* RECENT PAYMENTS */}
          <section className="bg-[#111827] border border-white/10 rounded-2xl p-6">

            <div className="mb-5">

              <h2 className="text-lg font-semibold">
                Recent Payments
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                Your recent payment activity
              </p>

            </div>

            {data.recentPayments.length === 0 ? (

              <p className="text-gray-500 text-sm">
                No payments available.
              </p>

            ) : (

              <div className="overflow-x-auto">

                <table className="w-full text-sm">

                  <thead>

                    <tr className="border-b border-white/10 text-gray-500">

                      <th className="text-left py-3 font-medium">
                        Invoice
                      </th>

                      <th className="text-left py-3 font-medium">
                        Project
                      </th>

                      <th className="text-left py-3 font-medium">
                        Amount
                      </th>

                      <th className="text-left py-3 font-medium">
                        Method
                      </th>

                      <th className="text-left py-3 font-medium">
                        Date
                      </th>

                      <th className="text-left py-3 font-medium">
                        Status
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {data.recentPayments.map(
                      (payment) => (

                        <tr
                          key={payment.id}
                          className="border-b border-white/5 last:border-0"
                        >

                          <td className="py-4">
                            {payment.invoice}
                          </td>

                          <td className="py-4 text-gray-400">
                            {payment.project}
                          </td>

                          <td className="py-4 font-medium">
                            {formatCurrency(
                              payment.amount
                            )}
                          </td>

                          <td className="py-4 text-gray-400">
                            {payment.paymentMethod}
                          </td>

                          <td className="py-4 text-gray-400">
                            {formatDate(
                              payment.paymentDate
                            )}
                          </td>

                          <td className="py-4">

                            <span
                              className={`px-2.5 py-1 rounded-full text-xs border ${getStatusStyle(
                                payment.status
                              )}`}
                            >
                              {payment.status}
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

        </div>
      </div>
    </div>
  );
}