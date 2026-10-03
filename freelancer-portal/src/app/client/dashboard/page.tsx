"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Freelancer = {
  id: string;
  freelancer: {
    id: string;
    name: string;
    email: string;
  } | null;
  company: string;
  clientName: string;
  email: string;
};

type Project = {
  id: string;
  name: string;
  description: string;
  budget: number;
  deadline: string;
  status: string;
  freelancer: string;
};

type Invoice = {
  id: string;
  invoiceNumber: string;
  amount: number;
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
    totalPaid: number;
  };

  freelancers: Freelancer[];
  recentProjects: Project[];
  recentInvoices: Invoice[];
  recentPayments: Payment[];
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

export default function ClientDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      await fetch("/api/client/sync", {
      method: "POST",
    });

      const response = await fetch(
        "/api/dashboard/client",
        {
          method: "GET",
          credentials: "include",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        setError(
          result.message ||
            "Failed to load dashboard."
        );
        return;
      }

      setData(result);
    } catch (error) {
      console.error(error);
      setError(
        "Unable to connect to the server."
      );
    } finally {
      setLoading(false);
    }
  };

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
      <div className="min-h-screen bg-[#09090b] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />

          <p className="text-gray-400">
            Loading your dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#09090b] text-white flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-[#111113] border border-white/10 rounded-2xl p-8 text-center">
          <div className="text-4xl mb-4">
            ⚠️
          </div>

          <h1 className="text-xl font-semibold mb-2">
            Unable to load dashboard
          </h1>

          <p className="text-gray-400 mb-6">
            {error || "Something went wrong."}
          </p>

          <button
            onClick={loadDashboard}
            className="px-5 py-3 bg-white text-black rounded-xl font-medium hover:bg-gray-200"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-white">
      {/* NAVBAR */}

      <header className="fixed top-0 left-0 right-0 h-16 bg-[#0d0d0f]/95 backdrop-blur border-b border-white/10 z-50">
        <div className="h-full px-6 flex items-center justify-between">
          <Link
            href="/client/dashboard"
            className="text-xl font-bold tracking-tight"
          >
            Freelancer
            <span className="text-gray-400">
              Portal
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium">
                {data.client.name}
              </p>

              <p className="text-xs text-gray-500">
                Client
              </p>
            </div>

            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm rounded-lg border border-white/10 hover:bg-white/5 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* SIDEBAR */}

      <aside className="fixed top-16 left-0 bottom-0 w-64 bg-[#0d0d0f] border-r border-white/10 hidden md:block">
        <nav className="p-4 space-y-1">
          <Link
            href="/client/dashboard"
            className="block px-4 py-3 rounded-lg bg-white/10 text-white"
          >
            📊 Dashboard
          </Link>

          <Link
            href="/client/workspace"
            className="block px-4 py-3 rounded-lg text-gray-400 hover:text-white hover:bg-white/5"
          >
            🏢 My Freelancers
          </Link>

          <Link
            href="/client/invoices"
            className="block px-4 py-3 rounded-lg text-gray-400 hover:text-white hover:bg-white/5"
          >
            🧾 Invoices
          </Link>

          <Link
            href="/client/payments"
            className="block px-4 py-3 rounded-lg text-gray-400 hover:text-white hover:bg-white/5"
          >
            💳 Payments
          </Link>

          <Link
            href="/client/files"
            className="block px-4 py-3 rounded-lg text-gray-400 hover:text-white hover:bg-white/5"
          >
            📎 Files
          </Link>

          <Link
            href="/client/messages"
            className="block px-4 py-3 rounded-lg text-gray-400 hover:text-white hover:bg-white/5"
          >
            💬 Messages
          </Link>
        </nav>
      </aside>

      {/* MAIN */}

      <main className="md:ml-64 pt-16 min-h-screen">
        <div className="p-6 md:p-8 max-w-7xl mx-auto">
          {/* WELCOME */}

          <div className="mb-8">
            <p className="text-sm text-gray-500 mb-2">
              Client Portal
            </p>

            <h1 className="text-3xl md:text-4xl font-bold">
              Welcome back, {data.client.name}
            </h1>

            <p className="text-gray-400 mt-2">
              Manage your freelancers, projects,
              invoices and payments.
            </p>
          </div>

          {/* STATS */}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-[#111113] border border-white/10 rounded-2xl p-5">
              <div className="text-2xl mb-3">
                👥
              </div>

              <p className="text-sm text-gray-500">
                My Freelancers
              </p>

              <p className="text-2xl font-bold mt-1">
                {data.stats.totalFreelancers}
              </p>
            </div>

            <div className="bg-[#111113] border border-white/10 rounded-2xl p-5">
              <div className="text-2xl mb-3">
                📁
              </div>

              <p className="text-sm text-gray-500">
                Active Projects
              </p>

              <p className="text-2xl font-bold mt-1">
                {data.stats.activeProjects}
              </p>
            </div>

            <div className="bg-[#111113] border border-white/10 rounded-2xl p-5">
              <div className="text-2xl mb-3">
                ⏳
              </div>

              <p className="text-sm text-gray-500">
                Pending Invoices
              </p>

              <p className="text-2xl font-bold mt-1">
                {formatCurrency(
                  data.stats.pendingInvoices
                )}
              </p>
            </div>

            <div className="bg-[#111113] border border-white/10 rounded-2xl p-5">
              <div className="text-2xl mb-3">
                💰
              </div>

              <p className="text-sm text-gray-500">
                Total Paid
              </p>

              <p className="text-2xl font-bold mt-1">
                {formatCurrency(
                  data.stats.totalPaid
                )}
              </p>
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
                  Your active freelancer relationships
                </p>
              </div>
            </div>

            {data.freelancers.length === 0 ? (
              <div className="bg-[#111113] border border-white/10 rounded-2xl p-10 text-center">
                <div className="text-4xl mb-4">
                  👥
                </div>

                <h3 className="text-lg font-semibold mb-2">
                  No freelancers yet
                </h3>

                <p className="text-gray-500">
                  Your freelancer relationships will
                  appear here once a freelancer adds
                  your account.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {data.freelancers.map(
                  (relationship) => (
                    <div
                      key={relationship.id}
                      className="bg-[#111113] border border-white/10 rounded-2xl p-6 hover:border-white/20 transition"
                    >
                      <div className="flex items-start justify-between mb-5">
                        <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-xl">
                          👤
                        </div>

                        <span className="px-3 py-1 rounded-full text-xs bg-green-500/10 text-green-400">
                          Connected
                        </span>
                      </div>

                      <h3 className="text-lg font-semibold">
                        {relationship.freelancer
                          ?.name ||
                          "Freelancer"}
                      </h3>

                      <p className="text-sm text-gray-500 mt-1">
                        {relationship.freelancer
                          ?.email || ""}
                      </p>

                      <div className="mt-4 pt-4 border-t border-white/10">
                        <p className="text-xs text-gray-500">
                          Company
                        </p>

                        <p className="text-sm text-gray-300 mt-1">
                          {relationship.company}
                        </p>
                      </div>

                      <Link
                        href={`/client/workspace?freelancer=${relationship.id}`}
                        className="block text-center mt-5 px-4 py-3 rounded-xl bg-white text-black font-medium hover:bg-gray-200 transition"
                      >
                        Open Workspace →
                      </Link>
                    </div>
                  )
                )}
              </div>
            )}
          </section>

          {/* RECENT PROJECTS */}

          <section className="bg-[#111113] border border-white/10 rounded-2xl overflow-hidden mb-8">
            <div className="p-6 border-b border-white/10">
              <h2 className="text-lg font-semibold">
                Recent Projects
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                Your latest project activity
              </p>
            </div>

            {data.recentProjects.length === 0 ? (
              <div className="p-10 text-center text-gray-500">
                No projects available.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10 text-left">
                      <th className="px-6 py-4 text-xs text-gray-500 uppercase">
                        Project
                      </th>

                      <th className="px-6 py-4 text-xs text-gray-500 uppercase">
                        Freelancer
                      </th>

                      <th className="px-6 py-4 text-xs text-gray-500 uppercase">
                        Budget
                      </th>

                      <th className="px-6 py-4 text-xs text-gray-500 uppercase">
                        Deadline
                      </th>

                      <th className="px-6 py-4 text-xs text-gray-500 uppercase">
                        Status
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {data.recentProjects.map(
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
                            {project.freelancer}
                          </td>

                          <td className="px-6 py-4">
                            {formatCurrency(
                              project.budget
                            )}
                          </td>

                          <td className="px-6 py-4 text-gray-400">
                            {formatDate(
                              project.deadline
                            )}
                          </td>

                          <td className="px-6 py-4">
                            <span className="px-3 py-1 rounded-full text-xs bg-blue-500/10 text-blue-400">
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

          {/* RECENT INVOICES */}

          <section className="bg-[#111113] border border-white/10 rounded-2xl overflow-hidden mb-8">
            <div className="p-6 border-b border-white/10">
              <h2 className="text-lg font-semibold">
                Recent Invoices
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                Your latest invoices
              </p>
            </div>

            {data.recentInvoices.length === 0 ? (
              <div className="p-10 text-center text-gray-500">
                No invoices available.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10 text-left">
                      <th className="px-6 py-4 text-xs text-gray-500 uppercase">
                        Invoice
                      </th>

                      <th className="px-6 py-4 text-xs text-gray-500 uppercase">
                        Project
                      </th>

                      <th className="px-6 py-4 text-xs text-gray-500 uppercase">
                        Amount
                      </th>

                      <th className="px-6 py-4 text-xs text-gray-500 uppercase">
                        Due Date
                      </th>

                      <th className="px-6 py-4 text-xs text-gray-500 uppercase">
                        Status
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {data.recentInvoices.map(
                      (invoice) => (
                        <tr
                          key={invoice.id}
                          className="border-b border-white/5 hover:bg-white/[0.02]"
                        >
                          <td className="px-6 py-4 font-medium">
                            {invoice.invoiceNumber}
                          </td>

                          <td className="px-6 py-4 text-gray-400">
                            {invoice.project}
                          </td>

                          <td className="px-6 py-4">
                            {formatCurrency(
                              invoice.amount
                            )}
                          </td>

                          <td className="px-6 py-4 text-gray-400">
                            {formatDate(
                              invoice.dueDate
                            )}
                          </td>

                          <td className="px-6 py-4">
                            <span className="px-3 py-1 rounded-full text-xs bg-yellow-500/10 text-yellow-400">
                              {invoice.status}
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

          {/* RECENT PAYMENTS */}

          <section className="bg-[#111113] border border-white/10 rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-white/10">
              <h2 className="text-lg font-semibold">
                Recent Payments
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                Your latest payment activity
              </p>
            </div>

            {data.recentPayments.length === 0 ? (
              <div className="p-10 text-center text-gray-500">
                No payments available.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10 text-left">
                      <th className="px-6 py-4 text-xs text-gray-500 uppercase">
                        Invoice
                      </th>

                      <th className="px-6 py-4 text-xs text-gray-500 uppercase">
                        Project
                      </th>

                      <th className="px-6 py-4 text-xs text-gray-500 uppercase">
                        Amount
                      </th>

                      <th className="px-6 py-4 text-xs text-gray-500 uppercase">
                        Method
                      </th>

                      <th className="px-6 py-4 text-xs text-gray-500 uppercase">
                        Date
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {data.recentPayments.map(
                      (payment) => (
                        <tr
                          key={payment.id}
                          className="border-b border-white/5 hover:bg-white/[0.02]"
                        >
                          <td className="px-6 py-4 font-medium">
                            {payment.invoice}
                          </td>

                          <td className="px-6 py-4 text-gray-400">
                            {payment.project}
                          </td>

                          <td className="px-6 py-4">
                            {formatCurrency(
                              payment.amount
                            )}
                          </td>

                          <td className="px-6 py-4 text-gray-400">
                            {payment.paymentMethod}
                          </td>

                          <td className="px-6 py-4 text-gray-400">
                            {formatDate(
                              payment.paymentDate
                            )}
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
      </main>
    </div>
  );
}