"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Client {
  _id: string;
  name: string;
  company: string;
}

interface Project {
  _id: string;
  name: string;
  budget: number;
}

interface Invoice {
  _id: string;
  invoiceNumber: string;
  amount: number;
  issueDate: string;
  dueDate: string;
  status: string;
  client: Client;
  project: Project;
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  const [showForm, setShowForm] = useState(false);

  const [clientId, setClientId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [amount, setAmount] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [dueDate, setDueDate] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const getUser = () => {
    if (typeof window === "undefined") return null;

    const user = localStorage.getItem("user");

    if (!user) return null;

    try {
      return JSON.parse(user);
    } catch {
      return null;
    }
  };

  const loadData = async () => {
    const user = getUser();

    if (!user?.id) return;

    try {
      const [
        clientsResponse,
        projectsResponse,
        invoicesResponse,
      ] = await Promise.all([
        fetch(`/api/clients?freelancerId=${user.id}`),
        fetch(`/api/projects?freelancerId=${user.id}`),
        fetch(`/api/invoices?freelancerId=${user.id}`),
      ]);

      const clientsData = await clientsResponse.json();
      const projectsData = await projectsResponse.json();
      const invoicesData = await invoicesResponse.json();

      if (clientsData.success) {
        setClients(clientsData.clients);
      }

      if (projectsData.success) {
        setProjects(projectsData.projects);
      }

      if (invoicesData.success) {
        setInvoices(invoicesData.invoices);
      }
    } catch (error) {
      console.error("Failed to load invoice data:", error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const generateInvoiceNumber = () => {
    return `INV-${String(invoices.length + 1).padStart(3, "0")}`;
  };

  const handleCreateInvoice = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    setMessage("");

    const user = getUser();

    if (!user?.id) {
      setMessage("Please login first.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/invoices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          freelancerId: user.id,
          clientId,
          projectId,
          invoiceNumber: generateInvoiceNumber(),
          amount,
          issueDate,
          dueDate,
          status: "Pending",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Failed to create invoice.");
        return;
      }

      setMessage("Invoice created successfully.");

      setClientId("");
      setProjectId("");
      setAmount("");
      setIssueDate("");
      setDueDate("");
      setShowForm(false);

      await loadData();
    } catch (error) {
      console.error(error);
      setMessage("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  const filteredInvoices = invoices.filter((invoice) => {
    const text = search.toLowerCase();

    const matchesSearch =
      invoice.invoiceNumber.toLowerCase().includes(text) ||
      invoice.client?.name?.toLowerCase().includes(text) ||
      invoice.client?.company?.toLowerCase().includes(text) ||
      invoice.project?.name?.toLowerCase().includes(text);

    const matchesStatus =
      statusFilter === "All" ||
      invoice.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalAmount = invoices.reduce(
    (sum, invoice) => sum + invoice.amount,
    0
  );

  const pendingAmount = invoices
    .filter((invoice) => invoice.status === "Pending")
    .reduce((sum, invoice) => sum + invoice.amount, 0);

  const paidAmount = invoices
    .filter((invoice) => invoice.status === "Paid")
    .reduce((sum, invoice) => sum + invoice.amount, 0);

  return (
    <main className="min-h-screen bg-slate-950 text-white">

      {/* Navbar */}
      <nav className="border-b border-slate-800 bg-slate-900">
        <div className="flex items-center justify-between px-6 py-4">

          <Link
            href="/freelancer/dashboard"
            className="text-xl font-bold text-blue-400"
          >
            FreelancerPortal
          </Link>

          <Link
            href="/freelancer/dashboard"
            className="text-sm text-slate-400 hover:text-white"
          >
            Dashboard
          </Link>

        </div>
      </nav>

      <div className="flex">

        {/* Sidebar */}
        <aside className="w-64 min-h-[calc(100vh-73px)] border-r border-slate-800 bg-slate-900 p-5">

          <div className="space-y-2">

            <Link
              href="/freelancer/dashboard"
              className="block px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800"
            >
              Dashboard
            </Link>

            <Link
              href="/freelancer/clients"
              className="block px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800"
            >
              Clients
            </Link>

            <Link
              href="/freelancer/projects"
              className="block px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800"
            >
              Projects
            </Link>

            <Link
              href="/freelancer/invoices"
              className="block px-4 py-3 rounded-lg bg-blue-600"
            >
              Invoices
            </Link>

            <Link
              href="/freelancer/payments"
              className="block px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800"
            >
              Payments
            </Link>

            <Link
              href="/freelancer/files"
              className="block px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800"
            >
              Files
            </Link>

            <Link
              href="/freelancer/messages"
              className="block px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800"
            >
              Messages
            </Link>

            <Link
              href="/freelancer/reports"
              className="block px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800"
            >
              Reports
            </Link>

          </div>
        </aside>

        {/* Main */}
        <section className="flex-1 p-8">

          {/* Heading */}
          <div className="flex items-center justify-between mb-8">

            <div>
              <h1 className="text-3xl font-bold">
                Invoices
              </h1>

              <p className="text-slate-400 mt-1">
                Create and manage client invoices
              </p>
            </div>

            <button
              onClick={() => setShowForm(!showForm)}
              className="px-5 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 font-semibold"
            >
              + Create Invoice
            </button>

          </div>

          {/* Message */}
          {message && (
            <div className="mb-6 p-4 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-300">
              {message}
            </div>
          )}

          {/* Summary */}
          <div className="grid md:grid-cols-3 gap-5 mb-8">

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <p className="text-slate-400">
                Total Invoices
              </p>

              <p className="text-3xl font-bold mt-2">
                {invoices.length}
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <p className="text-slate-400">
                Total Amount
              </p>

              <p className="text-3xl font-bold mt-2">
                ₹{totalAmount.toLocaleString()}
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <p className="text-slate-400">
                Pending Amount
              </p>

              <p className="text-3xl font-bold mt-2 text-yellow-400">
                ₹{pendingAmount.toLocaleString()}
              </p>
            </div>

          </div>

          {/* Create Invoice Form */}
          {showForm && (
            <form
              onSubmit={handleCreateInvoice}
              className="mb-8 bg-slate-900 border border-slate-800 rounded-xl p-6"
            >

              <h2 className="text-xl font-semibold mb-5">
                Create New Invoice
              </h2>

              <div className="grid md:grid-cols-2 gap-4">

                <select
                  value={clientId}
                  onChange={(e) =>
                    setClientId(e.target.value)
                  }
                  required
                  className="px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 outline-none focus:border-blue-500"
                >
                  <option value="">
                    Select Client
                  </option>

                  {clients.map((client) => (
                    <option
                      key={client._id}
                      value={client._id}
                    >
                      {client.name} - {client.company}
                    </option>
                  ))}
                </select>

                <select
                  value={projectId}
                  onChange={(e) =>
                    setProjectId(e.target.value)
                  }
                  required
                  className="px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 outline-none focus:border-blue-500"
                >
                  <option value="">
                    Select Project
                  </option>

                  {projects.map((project) => (
                    <option
                      key={project._id}
                      value={project._id}
                    >
                      {project.name}
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  placeholder="Amount"
                  value={amount}
                  onChange={(e) =>
                    setAmount(e.target.value)
                  }
                  required
                  min="0"
                  className="px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 outline-none focus:border-blue-500"
                />

                <input
                  type="date"
                  value={issueDate}
                  onChange={(e) =>
                    setIssueDate(e.target.value)
                  }
                  required
                  className="px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 outline-none focus:border-blue-500"
                />

                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) =>
                    setDueDate(e.target.value)
                  }
                  required
                  className="px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 outline-none focus:border-blue-500"
                />

              </div>

              <div className="flex gap-3 mt-5">

                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 font-semibold"
                >
                  {loading
                    ? "Creating..."
                    : "Create Invoice"}
                </button>

                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-5 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700"
                >
                  Cancel
                </button>

              </div>

            </form>
          )}

          {/* Search + Filter */}
          <div className="flex flex-wrap gap-4 mb-6">

            <input
              type="text"
              placeholder="Search invoices..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              className="flex-1 min-w-[250px] px-4 py-3 rounded-lg bg-slate-900 border border-slate-800 outline-none focus:border-blue-500"
            />

            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value)
              }
              className="px-4 py-3 rounded-lg bg-slate-900 border border-slate-800 outline-none"
            >
              <option>All</option>
              <option>Draft</option>
              <option>Pending</option>
              <option>Paid</option>
              <option>Overdue</option>
            </select>

          </div>

          {/* Invoice Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">

            <div className="overflow-x-auto">

              <table className="w-full">

                <thead className="bg-slate-800">

                  <tr>

                    <th className="text-left px-6 py-4">
                      Invoice
                    </th>

                    <th className="text-left px-6 py-4">
                      Client
                    </th>

                    <th className="text-left px-6 py-4">
                      Project
                    </th>

                    <th className="text-left px-6 py-4">
                      Amount
                    </th>

                    <th className="text-left px-6 py-4">
                      Due Date
                    </th>

                    <th className="text-left px-6 py-4">
                      Status
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {filteredInvoices.length === 0 ? (

                    <tr>
                      <td
                        colSpan={6}
                        className="text-center px-6 py-12 text-slate-400"
                      >
                        No invoices found.
                      </td>
                    </tr>

                  ) : (

                    filteredInvoices.map((invoice) => (

                      <tr
                        key={invoice._id}
                        className="border-t border-slate-800 hover:bg-slate-800/50"
                      >

                        <td className="px-6 py-4 font-medium">
                          {invoice.invoiceNumber}
                        </td>

                        <td className="px-6 py-4">
                          {invoice.client?.company ||
                            invoice.client?.name}
                        </td>

                        <td className="px-6 py-4 text-slate-300">
                          {invoice.project?.name}
                        </td>

                        <td className="px-6 py-4 font-semibold">
                          ₹{invoice.amount.toLocaleString()}
                        </td>

                        <td className="px-6 py-4 text-slate-300">
                          {new Date(
                            invoice.dueDate
                          ).toLocaleDateString("en-IN")}
                        </td>

                        <td className="px-6 py-4">

                          <span
                            className={`px-3 py-1 rounded-full text-xs ${
                              invoice.status === "Paid"
                                ? "bg-green-500/10 text-green-400"
                                : invoice.status === "Overdue"
                                ? "bg-red-500/10 text-red-400"
                                : "bg-yellow-500/10 text-yellow-400"
                            }`}
                          >
                            {invoice.status}
                          </span>

                        </td>

                      </tr>

                    ))

                  )}

                </tbody>

              </table>

            </div>

          </div>

        </section>

      </div>

    </main>
  );
}