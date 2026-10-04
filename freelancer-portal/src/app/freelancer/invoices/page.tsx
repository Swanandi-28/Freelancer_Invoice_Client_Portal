"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Client = {
  _id: string;
  name: string;
  company: string;
  email: string;
};

type Project = {
  _id: string;
  name: string;
  description?: string;
  budget: number;
  deadline: string;
  status: string;
  client:
    | string
    | {
        _id: string;
        name: string;
        company: string;
      };
};

type Invoice = {
  _id: string;
  invoiceNumber: string;
  amount: number;
  paidAmount: number;
  pendingAmount: number;
  issueDate: string;
  dueDate: string;
  status: "Draft" | "Pending" | "Paid" | "Overdue";
  client:
    | string
    | {
        _id: string;
        name: string;
        company: string;
      };
  project:
    | string
    | {
        _id: string;
        name: string;
        budget?: number;
      };
  createdAt: string;
};

export default function FreelancerInvoicesPage() {
  const router = useRouter();

  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  const [selectedClient, setSelectedClient] = useState("");
  const [selectedProject, setSelectedProject] = useState("");

  const [amount, setAmount] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [dueDate, setDueDate] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [showForm, setShowForm] = useState(false);

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        clientsResponse,
        projectsResponse,
        invoicesResponse,
      ] = await Promise.all([
        fetch("/api/clients", {
          cache: "no-store",
        }),

        fetch("/api/projects", {
          cache: "no-store",
        }),

        fetch("/api/invoices", {
          cache: "no-store",
        }),
      ]);

      const clientsData = await clientsResponse.json();
      const projectsData = await projectsResponse.json();
      const invoicesData = await invoicesResponse.json();

      if (
        clientsResponse.status === 401 ||
        projectsResponse.status === 401 ||
        invoicesResponse.status === 401
      ) {
        router.push("/login");
        return;
      }

      if (!clientsResponse.ok) {
        throw new Error(
          clientsData.message || "Failed to load clients."
        );
      }

      if (!projectsResponse.ok) {
        throw new Error(
          projectsData.message || "Failed to load projects."
        );
      }

      if (!invoicesResponse.ok) {
        throw new Error(
          invoicesData.message || "Failed to load invoices."
        );
      }

      setClients(clientsData.clients || []);
      setProjects(projectsData.projects || []);

      /*
        IMPORTANT:
        The API already calculates:

        pendingAmount =
        invoice.amount - completed payments for THAT invoice
      */

      setInvoices(
        (invoicesData.invoices || []).map(
          (invoice: Invoice) => ({
            ...invoice,
            amount: Number(invoice.amount || 0),
            paidAmount: Number(invoice.paidAmount || 0),
            pendingAmount: Number(
              invoice.pendingAmount ?? invoice.amount ?? 0
            ),
          })
        )
      );
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load invoice data."
      );
    } finally {
      setLoading(false);
    }
  };

  const availableProjects = useMemo(() => {
    if (!selectedClient) {
      return [];
    }

    return projects.filter((project) => {
      const clientId =
        typeof project.client === "string"
          ? project.client
          : project.client?._id;

      return clientId === selectedClient;
    });
  }, [projects, selectedClient]);

  const handleClientChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const clientId = event.target.value;

    setSelectedClient(clientId);
    setSelectedProject("");
  };

  const handleCreateInvoice = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!selectedClient) {
      setError("Please select a client.");
      return;
    }

    if (!selectedProject) {
      setError("Please select a project.");
      return;
    }

    if (!amount || Number(amount) <= 0) {
      setError("Please enter a valid invoice amount.");
      return;
    }

    if (!issueDate) {
      setError("Please select an issue date.");
      return;
    }

    if (!dueDate) {
      setError("Please select a due date.");
      return;
    }

    if (new Date(dueDate) < new Date(issueDate)) {
      setError(
        "Due date cannot be before the issue date."
      );
      return;
    }

    try {
      setCreating(true);

      const response = await fetch("/api/invoices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clientId: selectedClient,
          projectId: selectedProject,
          amount: Number(amount),
          issueDate,
          dueDate,
          status: "Pending",
        }),
      });

      const data = await response.json();

      if (response.status === 401) {
        router.push("/login");
        return;
      }

      if (!response.ok) {
        setError(
          data.message || "Failed to create invoice."
        );
        return;
      }

      setSuccess(
        `Invoice ${
          data.invoice?.invoiceNumber || ""
        } created successfully.`
      );

      setSelectedClient("");
      setSelectedProject("");
      setAmount("");
      setIssueDate("");
      setDueDate("");

      setShowForm(false);

      await fetchData();
    } catch (error) {
      console.error(error);
      setError("Unable to connect to the server.");
    } finally {
      setCreating(false);
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

  const formatCurrency = (value: number) => {
    return `₹${Number(value || 0).toLocaleString(
      "en-IN"
    )}`;
  };

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

  const getClientName = (
    client: Invoice["client"]
  ) => {
    if (typeof client === "string") {
      const foundClient = clients.find(
        (item) => item._id === client
      );

      return (
        foundClient?.company ||
        foundClient?.name ||
        "Unknown"
      );
    }

    return (
      client?.company ||
      client?.name ||
      "Unknown"
    );
  };

  const getProjectName = (
    project: Invoice["project"]
  ) => {
    if (typeof project === "string") {
      const foundProject = projects.find(
        (item) => item._id === project
      );

      return foundProject?.name || "Unknown";
    }

    return project?.name || "Unknown";
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case "Paid":
        return "bg-green-500/10 text-green-400";

      case "Pending":
        return "bg-yellow-500/10 text-yellow-400";

      case "Overdue":
        return "bg-red-500/10 text-red-400";

      case "Draft":
        return "bg-gray-500/10 text-gray-400";

      default:
        return "bg-gray-500/10 text-gray-400";
    }
  };

  const filteredInvoices = invoices.filter(
    (invoice) => {
      const searchText = search.toLowerCase();

      const matchesSearch =
        invoice.invoiceNumber
          .toLowerCase()
          .includes(searchText) ||
        getClientName(invoice.client)
          .toLowerCase()
          .includes(searchText) ||
        getProjectName(invoice.project)
          .toLowerCase()
          .includes(searchText);

      const matchesStatus =
        statusFilter === "All" ||
        invoice.status === statusFilter;

      return matchesSearch && matchesStatus;
    }
  );

  /*
    CORRECT FORMULA:

    Total Pending =
    Sum of pendingAmount for every invoice

    pendingAmount =
    invoice.amount - completed payments FOR THAT INVOICE
  */

  const totalAmount = invoices.reduce(
    (total, invoice) =>
      total + Number(invoice.amount || 0),
    0
  );

  const pendingAmount = invoices.reduce(
    (total, invoice) =>
      total + Number(invoice.pendingAmount || 0),
    0
  );

  const paidAmount = invoices.reduce(
    (total, invoice) =>
      total + Number(invoice.paidAmount || 0),
    0
  );

  return (
    <div>

      {/* NAVBAR */}


      {/* SIDEBAR */}


      {/* MAIN */}

      <div>

        <div className="p-6 md:p-8">

          {/* HEADER */}

          <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">

            <div>
              <h1 className="text-3xl font-bold">
                Invoices
              </h1>

              <p className="mt-2 text-gray-400">
                Create and manage invoices for your clients.
              </p>
            </div>

            <button
              onClick={() => {
                setError("");
                setSuccess("");
                setShowForm(!showForm);
              }}
              className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-medium transition hover:bg-blue-500"
            >
              {showForm
                ? "Close Form"
                : "+ Create Invoice"}
            </button>

          </div>

          {/* SUCCESS */}

          {success && (
            <div className="mb-6 rounded-lg border border-green-500/20 bg-green-500/10 p-4 text-green-400">
              {success}
            </div>
          )}

          {/* ERROR */}

          {error && (
            <div className="mb-6 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-red-400">
              {error}
            </div>
          )}

          {/* CREATE FORM */}

          {showForm && (
            <div className="mb-8 rounded-xl border border-white/10 bg-[#111827] p-6">

              <div className="mb-6">
                <h2 className="text-xl font-semibold">
                  Create New Invoice
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Invoice number will be generated automatically.
                </p>
              </div>

              <form
                onSubmit={handleCreateInvoice}
                className="grid gap-5 md:grid-cols-2"
              >

                {/* CLIENT */}

                <div>
                  <label className="mb-2 block text-sm text-gray-400">
                    Client
                  </label>

                  <select
                    value={selectedClient}
                    onChange={handleClientChange}
                    className="w-full rounded-lg border border-white/10 bg-[#0b0f19] px-4 py-3 text-white outline-none focus:border-blue-500"
                  >
                    <option value="">
                      Select Client
                    </option>

                    {clients.map((client) => (
                      <option
                        key={client._id}
                        value={client._id}
                      >
                        {client.company} — {client.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* PROJECT */}

                <div>
                  <label className="mb-2 block text-sm text-gray-400">
                    Project
                  </label>

                  <select
                    value={selectedProject}
                    onChange={(e) =>
                      setSelectedProject(e.target.value)
                    }
                    disabled={!selectedClient}
                    className="w-full rounded-lg border border-white/10 bg-[#0b0f19] px-4 py-3 text-white outline-none disabled:cursor-not-allowed disabled:opacity-50 focus:border-blue-500"
                  >
                    <option value="">
                      {selectedClient
                        ? "Select Project"
                        : "Select a client first"}
                    </option>

                    {availableProjects.map(
                      (project) => (
                        <option
                          key={project._id}
                          value={project._id}
                        >
                          {project.name}
                        </option>
                      )
                    )}
                  </select>
                </div>

                {/* AMOUNT */}

                <div>
                  <label className="mb-2 block text-sm text-gray-400">
                    Amount (₹)
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={amount}
                    onChange={(e) =>
                      setAmount(e.target.value)
                    }
                    placeholder="50000"
                    className="w-full rounded-lg border border-white/10 bg-[#0b0f19] px-4 py-3 text-white outline-none placeholder:text-gray-600 focus:border-blue-500"
                  />
                </div>

                {/* ISSUE DATE */}

                <div>
                  <label className="mb-2 block text-sm text-gray-400">
                    Issue Date
                  </label>

                  <input
                    type="date"
                    value={issueDate}
                    onChange={(e) =>
                      setIssueDate(e.target.value)
                    }
                    className="w-full rounded-lg border border-white/10 bg-[#0b0f19] px-4 py-3 text-white outline-none focus:border-blue-500"
                  />
                </div>

                {/* DUE DATE */}

                <div>
                  <label className="mb-2 block text-sm text-gray-400">
                    Due Date
                  </label>

                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) =>
                      setDueDate(e.target.value)
                    }
                    className="w-full rounded-lg border border-white/10 bg-[#0b0f19] px-4 py-3 text-white outline-none focus:border-blue-500"
                  />
                </div>

                {/* AUTOMATIC NUMBER */}

                <div>
                  <label className="mb-2 block text-sm text-gray-400">
                    Invoice Number
                  </label>

                  <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-gray-400">
                    Automatically generated
                  </div>
                </div>

                {/* BUTTONS */}

                <div className="flex items-end gap-3 md:col-span-2">

                  <button
                    type="submit"
                    disabled={creating}
                    className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {creating
                      ? "Creating..."
                      : "Create Invoice"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setError("");
                    }}
                    className="rounded-lg border border-white/10 px-6 py-3 text-sm text-gray-300 transition hover:bg-white/5"
                  >
                    Cancel
                  </button>

                </div>

              </form>
            </div>
          )}

          {/* SUMMARY */}

          <div className="mb-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

            <div className="rounded-xl border border-white/10 bg-[#111827] p-5">
              <p className="text-sm text-gray-400">
                Total Invoices
              </p>

              <p className="mt-3 text-3xl font-bold">
                {loading
                  ? "..."
                  : invoices.length}
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-[#111827] p-5">
              <p className="text-sm text-gray-400">
                Total Amount
              </p>

              <p className="mt-3 text-3xl font-bold">
                {loading
                  ? "..."
                  : formatCurrency(totalAmount)}
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-[#111827] p-5">
              <p className="text-sm text-gray-400">
                Pending Amount
              </p>

              <p className="mt-3 text-3xl font-bold text-yellow-400">
                {loading
                  ? "..."
                  : formatCurrency(pendingAmount)}
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-[#111827] p-5">
              <p className="text-sm text-gray-400">
                Paid Amount
              </p>

              <p className="mt-3 text-3xl font-bold text-green-400">
                {loading
                  ? "..."
                  : formatCurrency(paidAmount)}
              </p>
            </div>

          </div>

          {/* SEARCH */}

          <div className="mb-5 flex flex-col gap-4 md:flex-row">

            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search invoice, client or project..."
              className="flex-1 rounded-lg border border-white/10 bg-[#111827] px-4 py-3 text-white outline-none placeholder:text-gray-600 focus:border-blue-500"
            />

            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value)
              }
              className="rounded-lg border border-white/10 bg-[#111827] px-4 py-3 text-white outline-none focus:border-blue-500"
            >
              <option value="All">
                All Statuses
              </option>

              <option value="Draft">
                Draft
              </option>

              <option value="Pending">
                Pending
              </option>

              <option value="Paid">
                Paid
              </option>

              <option value="Overdue">
                Overdue
              </option>
            </select>

            <button
              onClick={fetchData}
              className="rounded-lg border border-white/10 bg-[#111827] px-5 py-3 text-sm text-gray-300 transition hover:bg-white/5"
            >
              ↻ Refresh
            </button>

          </div>

          {/* TABLE */}

          <div className="overflow-hidden rounded-xl border border-white/10 bg-[#111827]">

            <div className="border-b border-white/10 p-5">
              <h2 className="text-lg font-semibold">
                All Invoices
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                {filteredInvoices.length} invoice
                {filteredInvoices.length !== 1
                  ? "s"
                  : ""}
              </p>
            </div>

            {loading ? (
              <div className="p-8 text-center text-gray-500">
                Loading invoices...
              </div>
            ) : filteredInvoices.length === 0 ? (
              <div className="p-10 text-center">

                <div className="text-4xl">
                  🧾
                </div>

                <h3 className="mt-4 font-semibold">
                  No invoices found
                </h3>

                <p className="mt-2 text-sm text-gray-500">
                  Create your first invoice to see it here.
                </p>

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
                        Client
                      </th>

                      <th className="px-5 py-4">
                        Project
                      </th>

                      <th className="px-5 py-4">
                        Amount
                      </th>

                      <th className="px-5 py-4">
                        Paid
                      </th>

                      <th className="px-5 py-4">
                        Pending
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

                    {filteredInvoices.map(
                      (invoice) => (
                        <tr
                          key={invoice._id}
                          className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]"
                        >

                          <td className="px-5 py-4">
                            <p className="font-semibold">
                              {invoice.invoiceNumber}
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            <p className="text-sm text-gray-300">
                              {getClientName(
                                invoice.client
                              )}
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            <p className="text-sm text-gray-400">
                              {getProjectName(
                                invoice.project
                              )}
                            </p>
                          </td>

                          <td className="px-5 py-4 font-medium">
                            {formatCurrency(
                              invoice.amount
                            )}
                          </td>

                          <td className="px-5 py-4 font-medium text-green-400">
                            {formatCurrency(
                              invoice.paidAmount
                            )}
                          </td>

                          <td className="px-5 py-4 font-semibold text-yellow-400">
                            {formatCurrency(
                              invoice.pendingAmount
                            )}
                          </td>

                          <td className="px-5 py-4 text-sm text-gray-400">
                            {formatDate(
                              invoice.dueDate
                            )}
                          </td>

                          <td className="px-5 py-4">

                            <span
                              className={`rounded-full px-3 py-1 text-xs ${getStatusClass(
                                invoice.status
                              )}`}
                            >
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