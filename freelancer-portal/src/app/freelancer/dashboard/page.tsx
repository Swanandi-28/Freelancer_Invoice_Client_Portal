"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type DashboardStats = {
  totalClients: number;
  activeProjects: number;
  pendingInvoiceAmount: number;
  totalRevenue: number;
};

type Project = {
  _id: string;
  name: string;
  description?: string;
  budget: number;
  deadline: string;
  status: string;
  client?: {
    name: string;
    company: string;
  };
};

type Invoice = {
  _id: string;
  invoiceNumber: string;
  amount: number;
  issueDate: string;
  dueDate: string;
  status: string;
  client?: {
    name: string;
    company: string;
  };
  project?: {
    name: string;
  };
};

export default function FreelancerDashboard() {
  const router = useRouter();

  const [stats, setStats] = useState<DashboardStats>({
    totalClients: 0,
    activeProjects: 0,
    pendingInvoiceAmount: 0,
    totalRevenue: 0,
  });

  const [projects, setProjects] = useState<Project[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [userName, setUserName] = useState("Freelancer");

  useEffect(() => {
// The signed-in user comes from the server (HTTP-only cookie),
    // not from localStorage.
    fetchDashboard();
  }, [router]);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/dashboard/freelancer", {
        method: "GET",
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          router.push("/login");
          return;
        }

        throw new Error(data.message || "Failed to load dashboard.");
      }

      setStats(data.stats);
      setUserName(data.user?.name || "Freelancer");
      setProjects(data.recentProjects || []);
      setInvoices(data.recentInvoices || []);
    } catch (error) {
      console.error(error);
      setError("Unable to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
    } catch (error) {
      console.error(error);
    }

    localStorage.removeItem("user");
    router.push("/login");
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString("en-IN")}`;
  };

  const formatDate = (date: string) => {
    if (!date) return "-";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "Completed":
      case "Paid":
        return "bg-green-500/10 text-green-400";

      case "Pending":
      case "Overdue":
        return "bg-yellow-500/10 text-yellow-400";

      case "In Progress":
        return "bg-blue-500/10 text-blue-400";

      default:
        return "bg-gray-500/10 text-gray-400";
    }
  };

  return (
    <div>
      {/* NAVBAR */}

      {/* SIDEBAR */}

      {/* MAIN CONTENT */}
      <div>
        <div className="p-6 md:p-8">

          {/* HEADER */}
          <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h1 className="text-3xl font-bold">
                Welcome back, {userName} 👋
              </h1>

              <p className="mt-2 text-gray-400">
                Here's what's happening with your freelance business.
              </p>
            </div>

            <button
              onClick={fetchDashboard}
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-300 transition hover:bg-white/10"
            >
              ↻ Refresh
            </button>
          </div>

          {/* ERROR */}
          {error && (
            <div className="mb-6 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-red-400">
              {error}
            </div>
          )}

          {/* STATS */}
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

            {/* CLIENTS */}
            <div className="rounded-xl border border-white/10 bg-[#111827] p-5">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm text-gray-400">
                  Total Clients
                </span>

                <span className="rounded-lg bg-blue-500/10 p-2 text-blue-400">
                  👥
                </span>
              </div>

              <p className="text-3xl font-bold">
                {loading ? "..." : stats.totalClients}
              </p>

              <p className="mt-2 text-xs text-gray-500">
                Clients connected to you
              </p>
            </div>

            {/* PROJECTS */}
            <div className="rounded-xl border border-white/10 bg-[#111827] p-5">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm text-gray-400">
                  Active Projects
                </span>

                <span className="rounded-lg bg-purple-500/10 p-2 text-purple-400">
                  📁
                </span>
              </div>

              <p className="text-3xl font-bold">
                {loading ? "..." : stats.activeProjects}
              </p>

              <p className="mt-2 text-xs text-gray-500">
                Projects currently in progress
              </p>
            </div>

            {/* PENDING INVOICES */}
            <div className="rounded-xl border border-white/10 bg-[#111827] p-5">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm text-gray-400">
                  Pending Invoices
                </span>

                <span className="rounded-lg bg-yellow-500/10 p-2 text-yellow-400">
                  🧾
                </span>
              </div>

              <p className="text-3xl font-bold">
                {loading
                  ? "..."
                  : formatCurrency(stats.pendingInvoiceAmount)}
              </p>

              <p className="mt-2 text-xs text-gray-500">
                Unpaid balance on your invoices
              </p>
            </div>

            {/* REVENUE */}
            <div className="rounded-xl border border-white/10 bg-[#111827] p-5">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm text-gray-400">
                  Total Revenue
                </span>

                <span className="rounded-lg bg-green-500/10 p-2 text-green-400">
                  ₹
                </span>
              </div>

              <p className="text-3xl font-bold">
                {loading
                  ? "..."
                  : formatCurrency(stats.totalRevenue)}
              </p>

              <p className="mt-2 text-xs text-gray-500">
                From completed payments
              </p>
            </div>
          </div>

          {/* QUICK ACTIONS */}
          <div className="mt-8">
            <h2 className="mb-4 text-xl font-semibold">
              Quick Actions
            </h2>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

              <Link
                href="/freelancer/clients"
                className="rounded-xl border border-white/10 bg-[#111827] p-5 transition hover:border-blue-500/40 hover:bg-white/5"
              >
                <div className="mb-3 text-2xl">👥</div>
                <h3 className="font-semibold">Add Client</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Create a new client
                </p>
              </Link>

              <Link
                href="/freelancer/projects"
                className="rounded-xl border border-white/10 bg-[#111827] p-5 transition hover:border-blue-500/40 hover:bg-white/5"
              >
                <div className="mb-3 text-2xl">📁</div>
                <h3 className="font-semibold">New Project</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Start a new project
                </p>
              </Link>

              <Link
                href="/freelancer/invoices"
                className="rounded-xl border border-white/10 bg-[#111827] p-5 transition hover:border-blue-500/40 hover:bg-white/5"
              >
                <div className="mb-3 text-2xl">🧾</div>
                <h3 className="font-semibold">Create Invoice</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Generate an invoice
                </p>
              </Link>

              <Link
                href="/freelancer/payments"
                className="rounded-xl border border-white/10 bg-[#111827] p-5 transition hover:border-blue-500/40 hover:bg-white/5"
              >
                <div className="mb-3 text-2xl">💰</div>
                <h3 className="font-semibold">Record Payment</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Record a client payment
                </p>
              </Link>

            </div>
          </div>

          {/* RECENT PROJECTS */}
          <div className="mt-8 rounded-xl border border-white/10 bg-[#111827]">
            <div className="flex items-center justify-between border-b border-white/10 p-5">
              <div>
                <h2 className="text-lg font-semibold">
                  Recent Projects
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Your latest projects
                </p>
              </div>

              <Link
                href="/freelancer/projects"
                className="text-sm text-blue-400 hover:text-blue-300"
              >
                View all →
              </Link>
            </div>

            <div className="overflow-x-auto">
              {loading ? (
                <div className="p-6 text-gray-500">
                  Loading projects...
                </div>
              ) : projects.length === 0 ? (
                <div className="p-6 text-gray-500">
                  No projects found. Create your first project.
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10 text-left text-xs uppercase text-gray-500">
                      <th className="px-5 py-4">Project</th>
                      <th className="px-5 py-4">Client</th>
                      <th className="px-5 py-4">Budget</th>
                      <th className="px-5 py-4">Deadline</th>
                      <th className="px-5 py-4">Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {projects.map((project) => (
                      <tr
                        key={project._id}
                        className="border-b border-white/5 last:border-0"
                      >
                        <td className="px-5 py-4">
                          <p className="font-medium">
                            {project.name}
                          </p>

                          <p className="mt-1 text-xs text-gray-500">
                            {project.description || "No description"}
                          </p>
                        </td>

                        <td className="px-5 py-4 text-sm text-gray-300">
                          {project.client?.company ||
                            project.client?.name ||
                            "Unknown"}
                        </td>

                        <td className="px-5 py-4 text-sm">
                          {formatCurrency(project.budget)}
                        </td>

                        <td className="px-5 py-4 text-sm text-gray-400">
                          {formatDate(project.deadline)}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs ${getStatusStyle(
                              project.status
                            )}`}
                          >
                            {project.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* RECENT INVOICES */}
          <div className="mt-8 rounded-xl border border-white/10 bg-[#111827]">
            <div className="flex items-center justify-between border-b border-white/10 p-5">
              <div>
                <h2 className="text-lg font-semibold">
                  Recent Invoices
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Your latest invoices
                </p>
              </div>

              <Link
                href="/freelancer/invoices"
                className="text-sm text-blue-400 hover:text-blue-300"
              >
                View all →
              </Link>
            </div>

            <div className="overflow-x-auto">
              {loading ? (
                <div className="p-6 text-gray-500">
                  Loading invoices...
                </div>
              ) : invoices.length === 0 ? (
                <div className="p-6 text-gray-500">
                  No invoices found. Create your first invoice.
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10 text-left text-xs uppercase text-gray-500">
                      <th className="px-5 py-4">Invoice</th>
                      <th className="px-5 py-4">Client</th>
                      <th className="px-5 py-4">Project</th>
                      <th className="px-5 py-4">Amount</th>
                      <th className="px-5 py-4">Due Date</th>
                      <th className="px-5 py-4">Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {invoices.map((invoice) => (
                      <tr
                        key={invoice._id}
                        className="border-b border-white/5 last:border-0"
                      >
                        <td className="px-5 py-4 font-medium">
                          {invoice.invoiceNumber}
                        </td>

                        <td className="px-5 py-4 text-sm text-gray-300">
                          {invoice.client?.company ||
                            invoice.client?.name ||
                            "Unknown"}
                        </td>

                        <td className="px-5 py-4 text-sm text-gray-400">
                          {invoice.project?.name || "Unknown"}
                        </td>

                        <td className="px-5 py-4 text-sm font-medium">
                          {formatCurrency(invoice.amount)}
                        </td>

                        <td className="px-5 py-4 text-sm text-gray-400">
                          {formatDate(invoice.dueDate)}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs ${getStatusStyle(
                              invoice.status
                            )}`}
                          >
                            {invoice.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* FOOTER */}
          <div className="mt-8 border-t border-white/10 py-6 text-center text-sm text-gray-600">
            FreelancerPortal © 2026 — Freelancer Invoice & Client Portal
          </div>
        </div>
      </div>
    </div>
  );
}