"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import ConfirmDialog from "@/components/ConfirmDialog";

interface Client {
  _id?: string;
  name: string;
  company: string;
  email: string;
  projects: number;
  revenue: number;
  pendingAmount: number;
  status: string;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [showForm, setShowForm] = useState(false);

  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [pageLoading, setPageLoading] = useState(true);

  // Delete client (confirmation dialog)
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // Load clients from MongoDB
  const loadClients = async () => {
  try {
    // Project counts, revenue and pending amounts are calculated
    // by the server from MongoDB.
    const clientsResponse = await fetch("/api/clients", {
      credentials: "include",
      cache: "no-store",
    });

    const clientsData = await clientsResponse.json();

    if (!clientsResponse.ok) {
      setMessage(
        clientsData.message || "Failed to load clients."
      );
      return;
    }

    const formattedClients: Client[] = (
      clientsData.clients || []
    ).map((client: Client & { projectCount?: number; isConnected?: boolean }) => ({
      ...client,
      projects: client.projectCount || 0,
      revenue: client.revenue || 0,
      pendingAmount: client.pendingAmount || 0,
      status: client.isConnected ? "Connected" : "Not registered",
    }));

    setClients(formattedClients);
  } catch (error) {
    console.error(
      "Failed to load clients:",
      error
    );

    setMessage(
      "Unable to load clients from the server."
    );
  } finally {
    setPageLoading(false);
  }
};
  useEffect(() => {
    loadClients();
  }, []);

  // Add client
  const handleAddClient = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    setMessage("");

    try {
      setLoading(true);

      const response = await fetch("/api/clients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          company,
          email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Failed to add client.");
        return;
      }

      setMessage(data.message || "Client added successfully.");

      setName("");
      setCompany("");
      setEmail("");
      setShowForm(false);

      await loadClients();
    } catch (error) {
      console.error(error);
      setMessage("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  // Delete client relationship + all of its data (after confirmation)
  const handleDeleteClient = async () => {
    if (!deleteTarget?._id) return;

    try {
      setDeleting(true);
      setDeleteError("");

      const response = await fetch(`/api/clients/${deleteTarget._id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        setDeleteError(data.message || "Failed to delete client.");
        return;
      }

      setMessage(data.message || "Client deleted successfully.");
      setDeleteTarget(null);

      // Reload from MongoDB so counts, revenue and pending are up to date.
      await loadClients();
    } catch (error) {
      console.error(error);
      setDeleteError("Unable to connect to the server.");
    } finally {
      setDeleting(false);
    }
  };

  // Search
  const filteredClients = clients.filter((client) => {
    const searchText = search.toLowerCase();

    return (
      client.name.toLowerCase().includes(searchText) ||
      client.company.toLowerCase().includes(searchText) ||
      client.email.toLowerCase().includes(searchText)
    );
  });

  return (
    <div>

      {/* Navbar */}

      <div className="flex">

        {/* Sidebar */}

        {/* Main */}
        <section className="flex-1 min-w-0 p-4 md:p-8">

          {/* Heading */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">

            <div>
              <h1 className="text-3xl font-bold">
                Clients
              </h1>

              <p className="text-slate-400 mt-1">
                Manage your clients and their projects
              </p>
            </div>

            <button
              onClick={() => setShowForm(!showForm)}
              className="px-5 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 font-semibold"
            >
              + Add Client
            </button>

          </div>

          {/* Message */}
          {message && (
            <div className="mb-6 p-4 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-300">
              {message}
            </div>
          )}

          {/* Add Client Form */}
          {showForm && (
            <form
              onSubmit={handleAddClient}
              className="mb-8 bg-[#111827] border border-white/10 rounded-xl p-6"
            >

              <h2 className="text-xl font-semibold mb-5">
                Add New Client
              </h2>

              <div className="grid md:grid-cols-3 gap-4">

                <input
                  type="text"
                  placeholder="Client Name"
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value)
                  }
                  required
                  className="px-4 py-3 rounded-lg bg-[#0b0f19] border border-white/10 outline-none focus:border-blue-500"
                />

                <input
                  type="text"
                  placeholder="Company"
                  value={company}
                  onChange={(e) =>
                    setCompany(e.target.value)
                  }
                  required
                  className="px-4 py-3 rounded-lg bg-[#0b0f19] border border-white/10 outline-none focus:border-blue-500"
                />

                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  required
                  className="px-4 py-3 rounded-lg bg-[#0b0f19] border border-white/10 outline-none focus:border-blue-500"
                />

              </div>

              <div className="flex gap-3 mt-5">

                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 font-semibold"
                >
                  {loading ? "Saving..." : "Save Client"}
                </button>

                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-5 py-2.5 rounded-lg bg-white/10 hover:bg-white/20"
                >
                  Cancel
                </button>

              </div>

            </form>
          )}

          {/* Search */}
          <div className="mb-6">

            <input
              type="text"
              placeholder="Search clients..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              className="w-full max-w-md px-4 py-3 rounded-lg bg-[#111827] border border-white/10 outline-none focus:border-blue-500"
            />

          </div>

          {/* Clients */}
          <div className="bg-[#111827] border border-white/10 rounded-xl overflow-hidden">

            <div className="overflow-x-auto">

              <table className="w-full">

                <thead className="bg-white/5">

                  <tr>
                    <th className="text-left px-6 py-4">
                      Client
                    </th>

                    <th className="text-left px-6 py-4">
                      Company
                    </th>

                    <th className="text-left px-6 py-4">
                      Email
                    </th>

                    <th className="text-left px-6 py-4">
                      Projects
                    </th>

                    <th className="text-left px-6 py-4">Revenue</th>
                    <th className="text-left px-6 py-4">Pending</th>

                    <th className="text-left px-6 py-4">
                      Status
                    </th>

                    <th className="text-left px-6 py-4">
                      Actions
                    </th>
                  </tr>

                </thead>

                <tbody>

                  {filteredClients.length === 0 ? (

                    <tr>
                      <td
                        colSpan={8}
                        className="text-center px-6 py-12 text-slate-400"
                      >
                        {pageLoading
                          ? "Loading clients..."
                          : clients.length === 0
                            ? "No clients yet. Add your first client."
                            : "No clients match your search."}
                      </td>
                    </tr>

                  ) : (

                    filteredClients.map((client) => (

                      <tr
                        key={client._id}
                        className="border-t border-white/10 hover:bg-white/5"
                      >

                        <td className="px-6 py-4 font-medium">
                          {client.name}
                        </td>

                        <td className="px-6 py-4 text-slate-300">
                          {client.company}
                        </td>

                        <td className="px-6 py-4 text-slate-400">
                          {client.email}
                        </td>

                        <td className="px-6 py-4">
                          {client.projects}
                        </td>

                        <td className="px-6 py-4">
                          ₹{client.revenue.toLocaleString("en-IN")}
                        </td>
                        <td className="px-6 py-4">
                          ₹{client.pendingAmount.toLocaleString("en-IN")}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            title={
                              client.status === "Connected"
                                ? "This client has an account and can log in to see their workspace."
                                : "This client has not registered yet. They can register with this email to connect."
                            }
                            className={`px-3 py-1 rounded-full text-xs whitespace-nowrap ${
                              client.status === "Connected"
                                ? "bg-green-500/10 text-green-400"
                                : "bg-yellow-500/10 text-yellow-400"
                            }`}
                          >
                            {client.status}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <button
                            onClick={() => {
                              setDeleteError("");
                              setMessage("");
                              setDeleteTarget(client);
                            }}
                            className="px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 text-xs whitespace-nowrap hover:bg-red-500/10 transition"
                          >
                            Delete Client
                          </button>
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

      {deleteTarget && (
        <ConfirmDialog
          title="Delete Client"
          confirmLabel="Delete Client"
          busy={deleting}
          error={deleteError}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDeleteClient}
        >
          <p>Are you sure you want to delete:</p>
          <p className="mt-2 font-semibold text-white">
            {deleteTarget.company || deleteTarget.name}
          </p>
          <p className="mt-4">This will permanently remove:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Client relationship</li>
            <li>Projects</li>
            <li>Invoices</li>
            <li>Payments</li>
            <li>Files</li>
            <li>Messages</li>
          </ul>
          <p className="mt-4 text-gray-400">
            The client&apos;s login account will NOT be deleted. This action
            cannot be undone.
          </p>
        </ConfirmDialog>
      )}

    </div>
  );
}