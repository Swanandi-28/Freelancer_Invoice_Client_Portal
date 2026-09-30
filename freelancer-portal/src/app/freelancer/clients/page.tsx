"use client";

import { useState } from "react";
import Link from "next/link";

type Client = {
  id: number;
  name: string;
  company: string;
  email: string;
  projects: number;
  totalBilled: string;
  status: "Active" | "Pending";
};

export default function ClientsPage() {
  const [showForm, setShowForm] = useState(false);

  const [clients, setClients] = useState<Client[]>([
    {
      id: 1,
      name: "Rahul Sharma",
      company: "ABC Company",
      email: "rahul@abccompany.com",
      projects: 3,
      totalBilled: "₹75,000",
      status: "Active",
    },
    {
      id: 2,
      name: "Priya Mehta",
      company: "XYZ Solutions",
      email: "priya@xyzsolutions.com",
      projects: 2,
      totalBilled: "₹48,000",
      status: "Active",
    },
    {
      id: 3,
      name: "Amit Patil",
      company: "Tech Startup",
      email: "amit@techstartup.com",
      projects: 1,
      totalBilled: "₹32,000",
      status: "Pending",
    },
  ]);

  const [newClient, setNewClient] = useState({
    name: "",
    company: "",
    email: "",
  });

  function handleAddClient(e: React.FormEvent) {
    e.preventDefault();

    if (!newClient.name || !newClient.company || !newClient.email) {
      return;
    }

    const client: Client = {
      id: Date.now(),
      name: newClient.name,
      company: newClient.company,
      email: newClient.email,
      projects: 0,
      totalBilled: "₹0",
      status: "Pending",
    };

    setClients([...clients, client]);

    setNewClient({
      name: "",
      company: "",
      email: "",
    });

    setShowForm(false);
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">

      {/* Navbar */}
      <nav className="h-16 border-b border-slate-800 bg-slate-900 flex items-center justify-between px-6">

        <Link href="/" className="text-xl font-bold">
          Freelancer<span className="text-blue-500">Portal</span>
        </Link>

        <div className="flex items-center gap-5">

          <span className="text-sm text-slate-400">
            Welcome, Freelancer
          </span>

          <Link
            href="/login"
            className="text-sm text-slate-400 hover:text-white"
          >
            Logout
          </Link>

        </div>

      </nav>


      <div className="flex">

        {/* Sidebar */}
        <aside className="w-64 min-h-[calc(100vh-4rem)] border-r border-slate-800 bg-slate-900 p-5">

          <div className="mb-8">
            <p className="text-xs uppercase tracking-wider text-slate-500">
              Freelancer
            </p>

            <h2 className="text-lg font-semibold mt-1">
              Dashboard
            </h2>
          </div>

          <nav className="space-y-2">

            <SidebarLink
              href="/freelancer/dashboard"
              label="Dashboard"
              icon="📊"
            />

            <SidebarLink
              href="/freelancer/clients"
              label="Clients"
              icon="👥"
              active
            />

            <SidebarLink
              href="/freelancer/projects"
              label="Projects"
              icon="📁"
            />

            <SidebarLink
              href="/freelancer/invoices"
              label="Invoices"
              icon="🧾"
            />

            <SidebarLink
              href="/freelancer/payments"
              label="Payments"
              icon="💳"
            />

            <SidebarLink
              href="/freelancer/files"
              label="Files"
              icon="📎"
            />

            <SidebarLink
              href="/freelancer/messages"
              label="Messages"
              icon="💬"
            />

            <SidebarLink
              href="/freelancer/reports"
              label="Reports"
              icon="📈"
            />

          </nav>

        </aside>


        {/* Main Content */}
        <section className="flex-1 p-8">

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">

            <div>
              <h1 className="text-3xl font-bold">
                Clients
              </h1>

              <p className="text-slate-400 mt-2">
                Manage your clients and their projects.
              </p>
            </div>

            <button
              onClick={() => setShowForm(!showForm)}
              className="px-5 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 font-medium"
            >
              + Add Client
            </button>

          </div>


          {/* Add Client Form */}
          {showForm && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-8">

              <h2 className="text-xl font-semibold mb-6">
                Add New Client
              </h2>

              <form
                onSubmit={handleAddClient}
                className="grid grid-cols-1 md:grid-cols-3 gap-5"
              >

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Client Name
                  </label>

                  <input
                    type="text"
                    value={newClient.name}
                    onChange={(e) =>
                      setNewClient({
                        ...newClient,
                        name: e.target.value,
                      })
                    }
                    placeholder="Enter client name"
                    className="w-full px-4 py-3 rounded-lg bg-slate-950 border border-slate-700 focus:outline-none focus:border-blue-500"
                  />
                </div>


                <div>
                  <label className="block text-sm font-medium mb-2">
                    Company
                  </label>

                  <input
                    type="text"
                    value={newClient.company}
                    onChange={(e) =>
                      setNewClient({
                        ...newClient,
                        company: e.target.value,
                      })
                    }
                    placeholder="Enter company name"
                    className="w-full px-4 py-3 rounded-lg bg-slate-950 border border-slate-700 focus:outline-none focus:border-blue-500"
                  />
                </div>


                <div>
                  <label className="block text-sm font-medium mb-2">
                    Email Address
                  </label>

                  <input
                    type="email"
                    value={newClient.email}
                    onChange={(e) =>
                      setNewClient({
                        ...newClient,
                        email: e.target.value,
                      })
                    }
                    placeholder="client@example.com"
                    className="w-full px-4 py-3 rounded-lg bg-slate-950 border border-slate-700 focus:outline-none focus:border-blue-500"
                  />
                </div>


                <div className="md:col-span-3 flex justify-end gap-3">

                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-5 py-2.5 rounded-lg border border-slate-700 hover:bg-slate-800"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700"
                  >
                    Add Client
                  </button>

                </div>

              </form>

            </div>
          )}


          {/* Search */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-6">

            <input
              type="text"
              placeholder="Search clients..."
              className="w-full px-4 py-3 rounded-lg bg-slate-950 border border-slate-700 focus:outline-none focus:border-blue-500"
            />

          </div>


          {/* Client Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">

            <div className="overflow-x-auto">

              <table className="w-full">

                <thead className="border-b border-slate-800">

                  <tr className="text-left text-sm text-slate-400">

                    <th className="px-6 py-4">
                      Client
                    </th>

                    <th className="px-6 py-4">
                      Email
                    </th>

                    <th className="px-6 py-4">
                      Projects
                    </th>

                    <th className="px-6 py-4">
                      Total Billed
                    </th>

                    <th className="px-6 py-4">
                      Status
                    </th>

                    <th className="px-6 py-4">
                      Action
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {clients.map((client) => (

                    <tr
                      key={client.id}
                      className="border-b border-slate-800 last:border-0 hover:bg-slate-800/40"
                    >

                      <td className="px-6 py-5">

                        <div>
                          <p className="font-medium">
                            {client.name}
                          </p>

                          <p className="text-sm text-slate-500">
                            {client.company}
                          </p>
                        </div>

                      </td>


                      <td className="px-6 py-5 text-slate-400">
                        {client.email}
                      </td>


                      <td className="px-6 py-5">
                        {client.projects}
                      </td>


                      <td className="px-6 py-5 font-medium">
                        {client.totalBilled}
                      </td>


                      <td className="px-6 py-5">

                        <span
                          className={`text-xs px-3 py-1 rounded-full ${
                            client.status === "Active"
                              ? "bg-green-500/10 text-green-400"
                              : "bg-yellow-500/10 text-yellow-400"
                          }`}
                        >
                          {client.status}
                        </span>

                      </td>


                      <td className="px-6 py-5">

                        <button className="text-blue-400 hover:text-blue-300 text-sm">
                          View
                        </button>

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          </div>


          {/* Client Count */}
          <div className="mt-5 text-sm text-slate-500">
            Showing {clients.length} clients
          </div>

        </section>

      </div>

    </main>
  );
}


/* Sidebar */

function SidebarLink({
  href,
  label,
  icon,
  active = false,
}: {
  href: string;
  label: string;
  icon: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition ${
        active
          ? "bg-blue-600 text-white"
          : "text-slate-400 hover:bg-slate-800 hover:text-white"
      }`}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </Link>
  );
}