"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Client {
  _id?: string;
  name: string;
  company: string;
  email: string;
  projects: number;
  revenue: number;
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

  // Get logged-in freelancer
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

  // Load clients from MongoDB
  const loadClients = async () => {
    const user = getUser();

    if (!user?.id) {
      return;
    }

    try {
      const response = await fetch("/api/clients");

      const data = await response.json();

      if (data.success) {
        const formattedClients = data.clients.map(
          (client: Client) => ({
            ...client,
            projects: 0,
            revenue: 0,
            status: "Active",
          })
        );

        setClients(formattedClients);
      }
    } catch (error) {
      console.error("Failed to load clients:", error);
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

    const user = getUser();

    if (!user?.id) {
      setMessage("Please login first.");
      return;
    }

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

      setMessage("Client added successfully.");

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
              className="block px-4 py-3 rounded-lg bg-blue-600"
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
              className="block px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800"
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
              className="mb-8 bg-slate-900 border border-slate-800 rounded-xl p-6"
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
                  className="px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 outline-none focus:border-blue-500"
                />

                <input
                  type="text"
                  placeholder="Company"
                  value={company}
                  onChange={(e) =>
                    setCompany(e.target.value)
                  }
                  required
                  className="px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 outline-none focus:border-blue-500"
                />

                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
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
                  {loading ? "Saving..." : "Save Client"}
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

          {/* Search */}
          <div className="mb-6">

            <input
              type="text"
              placeholder="Search clients..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              className="w-full max-w-md px-4 py-3 rounded-lg bg-slate-900 border border-slate-800 outline-none focus:border-blue-500"
            />

          </div>

          {/* Clients */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">

            <div className="overflow-x-auto">

              <table className="w-full">

                <thead className="bg-slate-800">

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

                    <th className="text-left px-6 py-4">
                      Revenue
                    </th>

                    <th className="text-left px-6 py-4">
                      Status
                    </th>
                  </tr>

                </thead>

                <tbody>

                  {filteredClients.length === 0 ? (

                    <tr>
                      <td
                        colSpan={6}
                        className="text-center px-6 py-12 text-slate-400"
                      >
                        No clients found.
                      </td>
                    </tr>

                  ) : (

                    filteredClients.map((client) => (

                      <tr
                        key={client._id}
                        className="border-t border-slate-800 hover:bg-slate-800/50"
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
                          ₹{client.revenue.toLocaleString()}
                        </td>

                        <td className="px-6 py-4">
                          <span className="px-3 py-1 rounded-full text-xs bg-green-500/10 text-green-400">
                            {client.status}
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