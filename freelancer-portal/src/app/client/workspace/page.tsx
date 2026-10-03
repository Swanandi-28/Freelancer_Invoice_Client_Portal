"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";

type Project = {
  _id: string;
  name: string;
  description?: string;
  budget: number;
  deadline: string;
  status: string;
};

type Invoice = {
  _id: string;
  invoiceNumber: string;
  amount: number;
  dueDate: string;
  status: string;
  project?: {
    name: string;
  };
};

type Payment = {
  _id: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  status: string;
  invoice?: {
    invoiceNumber: string;
  };
};

type WorkspaceData = {
  freelancer: {
    _id: string;
    name: string;
    email: string;
  };

  client: {
    id: string;
    name: string;
    company: string;
    email: string;
  };

  projects: Project[];
  invoices: Invoice[];
  payments: Payment[];
};

export default function ClientWorkspace() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const freelancerId = searchParams.get("freelancer");

  const [data, setData] = useState<WorkspaceData | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!freelancerId) {
      setError("No freelancer selected.");
      setLoading(false);
      return;
    }

    fetchWorkspace();
  }, [freelancerId]);

  const fetchWorkspace = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `/api/client/workspace?freelancerId=${encodeURIComponent(
          freelancerId as string
        )}`,
        {
          method: "GET",
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
          result.message || "Failed to load workspace."
        );
      }

      setData(result);
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Unable to load workspace."
      );
    } finally {
      setLoading(false);
    }
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

  const statusStyle = (status: string) => {
    if (status === "Paid" || status === "Completed") {
      return "bg-green-500/10 text-green-400";
    }

    if (status === "Overdue") {
      return "bg-red-500/10 text-red-400";
    }

    if (status === "Pending") {
      return "bg-yellow-500/10 text-yellow-400";
    }

    if (status === "In Progress") {
      return "bg-blue-500/10 text-blue-400";
    }

    return "bg-gray-500/10 text-gray-400";
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-white">

      {/* NAVBAR */}

      <header className="fixed left-0 right-0 top-0 z-50 border-b border-white/10 bg-[#0b0f19]/95 backdrop-blur">

        <div className="flex h-16 items-center justify-between px-6">

          <Link
            href="/client/dashboard"
            className="text-xl font-bold"
          >
            Freelancer<span className="text-blue-500">Portal</span>
          </Link>

          <Link
            href="/client/dashboard"
            className="text-sm text-gray-400 hover:text-white"
          >
            ← Back to Dashboard
          </Link>

        </div>

      </header>

      {/* SIDEBAR */}

      <aside className="fixed bottom-0 left-0 top-16 hidden w-64 border-r border-white/10 bg-[#0f1420] md:block">

        <nav className="space-y-2 p-4">

          <Link
            href="/client/dashboard"
            className="block rounded-lg px-4 py-3 text-sm text-gray-400 hover:bg-white/5 hover:text-white"
          >
            Dashboard
          </Link>

          <div className="rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium">
            Workspace
          </div>

          <Link
            href="/client/invoices"
            className="block rounded-lg px-4 py-3 text-sm text-gray-400 hover:bg-white/5 hover:text-white"
          >
            Invoices
          </Link>

          <Link
            href="/client/payments"
            className="block rounded-lg px-4 py-3 text-sm text-gray-400 hover:bg-white/5 hover:text-white"
          >
            Payments
          </Link>

          <Link
            href="/client/files"
            className="block rounded-lg px-4 py-3 text-sm text-gray-400 hover:bg-white/5 hover:text-white"
          >
            Files
          </Link>

          <Link
            href="/client/messages"
            className="block rounded-lg px-4 py-3 text-sm text-gray-400 hover:bg-white/5 hover:text-white"
          >
            Messages
          </Link>

        </nav>

      </aside>

      {/* MAIN */}

      <main className="pt-16 md:ml-64">

        <div className="p-6 md:p-8">

          {/* LOADING */}

          {loading && (
            <div className="flex min-h-[500px] items-center justify-center">

              <div className="text-gray-400">
                Loading workspace...
              </div>

            </div>
          )}

          {/* ERROR */}

          {!loading && error && (
            <div className="mx-auto max-w-2xl rounded-xl border border-red-500/20 bg-red-500/10 p-8 text-center">

              <div className="text-4xl">
                🔒
              </div>

              <h1 className="mt-4 text-xl font-semibold">
                Workspace unavailable
              </h1>

              <p className="mt-2 text-sm text-red-300">
                {error}
              </p>

              <Link
                href="/client/dashboard"
                className="mt-6 inline-block rounded-lg bg-blue-600 px-5 py-3 text-sm font-medium hover:bg-blue-500"
              >
                Back to Dashboard
              </Link>

            </div>
          )}

          {/* WORKSPACE */}

          {!loading && !error && data && (

            <>

              {/* HEADER */}

              <div className="mb-8 rounded-2xl border border-white/10 bg-[#111827] p-6">

                <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">

                  <div className="flex items-center gap-4">

                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-500/10 text-xl font-bold text-blue-400">
                      {data.freelancer.name
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <div>

                      <p className="text-sm text-gray-500">
                        Private Workspace
                      </p>

                      <h1 className="text-2xl font-bold">
                        {data.freelancer.name}
                      </h1>

                      <p className="mt-1 text-sm text-gray-400">
                        {data.freelancer.email}
                      </p>

                    </div>

                  </div>

                  <div className="rounded-lg bg-green-500/10 px-4 py-3 text-sm text-green-400">
                    ✓ Active Relationship
                  </div>

                </div>

              </div>

              {/* SUMMARY */}

              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

                <div className="rounded-xl border border-white/10 bg-[#111827] p-5">

                  <p className="text-sm text-gray-400">
                    Projects
                  </p>

                  <p className="mt-3 text-3xl font-bold">
                    {data.projects.length}
                  </p>

                </div>

                <div className="rounded-xl border border-white/10 bg-[#111827] p-5">

                  <p className="text-sm text-gray-400">
                    Invoices
                  </p>

                  <p className="mt-3 text-3xl font-bold">
                    {data.invoices.length}
                  </p>

                </div>

                <div className="rounded-xl border border-white/10 bg-[#111827] p-5">

                  <p className="text-sm text-gray-400">
                    Payments
                  </p>

                  <p className="mt-3 text-3xl font-bold">
                    {data.payments.length}
                  </p>

                </div>

                <div className="rounded-xl border border-white/10 bg-[#111827] p-5">

                  <p className="text-sm text-gray-400">
                    Total Paid
                  </p>

                  <p className="mt-3 text-3xl font-bold">

                    {formatCurrency(
                      data.payments
                        .filter(
                          (payment) =>
                            payment.status === "Completed"
                        )
                        .reduce(
                          (total, payment) =>
                            total + payment.amount,
                          0
                        )
                    )}

                  </p>

                </div>

              </div>

              {/* PROJECTS */}

              <div className="mt-8 rounded-xl border border-white/10 bg-[#111827]">

                <div className="border-b border-white/10 p-5">

                  <h2 className="text-lg font-semibold">
                    Projects
                  </h2>

                </div>

                {data.projects.length === 0 ? (

                  <div className="p-6 text-gray-500">
                    No projects for this workspace.
                  </div>

                ) : (

                  <div className="overflow-x-auto">

                    <table className="w-full">

                      <thead>

                        <tr className="border-b border-white/10 text-left text-xs uppercase text-gray-500">

                          <th className="px-5 py-4">
                            Project
                          </th>

                          <th className="px-5 py-4">
                            Budget
                          </th>

                          <th className="px-5 py-4">
                            Deadline
                          </th>

                          <th className="px-5 py-4">
                            Status
                          </th>

                        </tr>

                      </thead>

                      <tbody>

                        {data.projects.map((project) => (

                          <tr
                            key={project._id}
                            className="border-b border-white/5 last:border-0"
                          >

                            <td className="px-5 py-4">

                              <p className="font-medium">
                                {project.name}
                              </p>

                              <p className="mt-1 text-xs text-gray-500">
                                {project.description ||
                                  "No description"}
                              </p>

                            </td>

                            <td className="px-5 py-4">
                              {formatCurrency(project.budget)}
                            </td>

                            <td className="px-5 py-4 text-sm text-gray-400">
                              {formatDate(project.deadline)}
                            </td>

                            <td className="px-5 py-4">

                              <span
                                className={`rounded-full px-3 py-1 text-xs ${statusStyle(
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

                  </div>

                )}

              </div>

              {/* INVOICES */}

              <div className="mt-8 rounded-xl border border-white/10 bg-[#111827]">

                <div className="flex items-center justify-between border-b border-white/10 p-5">

                  <h2 className="text-lg font-semibold">
                    Invoices
                  </h2>

                  <Link
                    href="/client/invoices"
                    className="text-sm text-blue-400 hover:text-blue-300"
                  >
                    View all →
                  </Link>

                </div>

                {data.invoices.length === 0 ? (

                  <div className="p-6 text-gray-500">
                    No invoices for this workspace.
                  </div>

                ) : (

                  <div className="overflow-x-auto">

                    <table className="w-full">

                      <thead>

                        <tr className="border-b border-white/10 text-left text-xs uppercase text-gray-500">

                          <th className="px-5 py-4">
                            Invoice
                          </th>

                          <th className="px-5 py-4">
                            Project
                          </th>

                          <th className="px-5 py-4">
                            Amount
                          </th>

                          <th className="px-5 py-4">
                            Due Date
                          </th>

                          <th className="px-5 py-4">
                            Status
                          </th>

                        </tr>

                      </thead>

                      <tbody>

                        {data.invoices.map((invoice) => (

                          <tr
                            key={invoice._id}
                            className="border-b border-white/5 last:border-0"
                          >

                            <td className="px-5 py-4 font-medium">
                              {invoice.invoiceNumber}
                            </td>

                            <td className="px-5 py-4 text-sm text-gray-400">
                              {invoice.project?.name ||
                                "Unknown"}
                            </td>

                            <td className="px-5 py-4 font-medium">
                              {formatCurrency(invoice.amount)}
                            </td>

                            <td className="px-5 py-4 text-sm text-gray-400">
                              {formatDate(invoice.dueDate)}
                            </td>

                            <td className="px-5 py-4">

                              <span
                                className={`rounded-full px-3 py-1 text-xs ${statusStyle(
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

                  </div>

                )}

              </div>

              {/* PAYMENTS */}

              <div className="mt-8 rounded-xl border border-white/10 bg-[#111827]">

                <div className="border-b border-white/10 p-5">

                  <h2 className="text-lg font-semibold">
                    Payment History
                  </h2>

                </div>

                {data.payments.length === 0 ? (

                  <div className="p-6 text-gray-500">
                    No payments for this workspace.
                  </div>

                ) : (

                  <div className="overflow-x-auto">

                    <table className="w-full">

                      <thead>

                        <tr className="border-b border-white/10 text-left text-xs uppercase text-gray-500">

                          <th className="px-5 py-4">
                            Invoice
                          </th>

                          <th className="px-5 py-4">
                            Amount
                          </th>

                          <th className="px-5 py-4">
                            Method
                          </th>

                          <th className="px-5 py-4">
                            Date
                          </th>

                          <th className="px-5 py-4">
                            Status
                          </th>

                        </tr>

                      </thead>

                      <tbody>

                        {data.payments.map((payment) => (

                          <tr
                            key={payment._id}
                            className="border-b border-white/5 last:border-0"
                          >

                            <td className="px-5 py-4 font-medium">
                              {payment.invoice?.invoiceNumber ||
                                "Unknown"}
                            </td>

                            <td className="px-5 py-4 font-medium">
                              {formatCurrency(payment.amount)}
                            </td>

                            <td className="px-5 py-4 text-sm text-gray-400">
                              {payment.paymentMethod}
                            </td>

                            <td className="px-5 py-4 text-sm text-gray-400">
                              {formatDate(payment.paymentDate)}
                            </td>

                            <td className="px-5 py-4">

                              <span
                                className={`rounded-full px-3 py-1 text-xs ${statusStyle(
                                  payment.status
                                )}`}
                              >
                                {payment.status}
                              </span>

                            </td>

                          </tr>

                        ))}

                      </tbody>

                    </table>

                  </div>

                )}

              </div>

            </>

          )}

        </div>

      </main>

    </div>
  );
}