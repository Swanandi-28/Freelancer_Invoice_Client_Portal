"use client";

import Link from "next/link";

const freelancers = [
  {
    id: 1,
    name: "Rahul Sharma",
    company: "ABC Company",
    project: "E-commerce Website",
    status: "Active",
    invoices: 3,
    pending: "₹25,000",
  },
  {
    id: 2,
    name: "Priya Mehta",
    company: "XYZ Solutions",
    project: "Brand Identity Design",
    status: "Active",
    invoices: 2,
    pending: "₹10,000",
  },
];

export default function ClientDashboard() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      {/* Navbar */}
      <header className="border-b border-slate-800 bg-slate-900">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold">
            Freelancer<span className="text-blue-500">Portal</span>
          </Link>

          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-400">
              Welcome, ABC Company
            </span>

            <button className="px-4 py-2 rounded-lg border border-slate-700 hover:bg-slate-800">
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Heading */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Client Dashboard</h1>

          <p className="text-slate-400 mt-2">
            Manage your freelancers, projects, invoices and payments.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <p className="text-slate-400 text-sm">My Freelancers</p>
            <h2 className="text-3xl font-bold mt-2">2</h2>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <p className="text-slate-400 text-sm">Active Projects</p>
            <h2 className="text-3xl font-bold mt-2">2</h2>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <p className="text-slate-400 text-sm">Pending Invoices</p>
            <h2 className="text-3xl font-bold mt-2">₹35,000</h2>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <p className="text-slate-400 text-sm">Total Paid</p>
            <h2 className="text-3xl font-bold mt-2">₹57,000</h2>
          </div>
        </div>

        {/* Freelancers */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold">My Freelancers</h2>

          <p className="text-slate-400 mt-1">
            Select a freelancer to view your private workspace.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {freelancers.map((freelancer) => (
            <div
              key={freelancer.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-lg font-bold">
                    {freelancer.name.charAt(0)}
                  </div>

                  <h3 className="text-xl font-semibold mt-4">
                    {freelancer.name}
                  </h3>

                  <p className="text-slate-400">{freelancer.company}</p>
                </div>

                <span className="px-3 py-1 rounded-full text-sm bg-green-500/10 text-green-400">
                  {freelancer.status}
                </span>
              </div>

              <div className="border-t border-slate-800 mt-6 pt-5">
                <p className="text-sm text-slate-400">Current Project</p>

                <p className="font-medium mt-1">
                  {freelancer.project}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-5">
                <div>
                  <p className="text-sm text-slate-400">Invoices</p>
                  <p className="text-lg font-semibold mt-1">
                    {freelancer.invoices}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-400">Pending</p>
                  <p className="text-lg font-semibold mt-1">
                    {freelancer.pending}
                  </p>
                </div>
              </div>

              <Link
                href={`/client/workspace?freelancer=${freelancer.id}`}
                className="block text-center w-full mt-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 font-medium transition"
              >
                Open Workspace
              </Link>
            </div>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="mt-10">
          <h2 className="text-2xl font-bold mb-5">Recent Activity</h2>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl divide-y divide-slate-800">
            <div className="p-5 flex justify-between">
              <div>
                <p className="font-medium">Invoice INV-002 received</p>
                <p className="text-sm text-slate-400 mt-1">
                  From Priya Mehta
                </p>
              </div>

              <span className="text-sm text-slate-500">
                2 hours ago
              </span>
            </div>

            <div className="p-5 flex justify-between">
              <div>
                <p className="font-medium">Project updated</p>
                <p className="text-sm text-slate-400 mt-1">
                  E-commerce Website
                </p>
              </div>

              <span className="text-sm text-slate-500">
                Yesterday
              </span>
            </div>

            <div className="p-5 flex justify-between">
              <div>
                <p className="font-medium">New file uploaded</p>
                <p className="text-sm text-slate-400 mt-1">
                  project-requirements.pdf
                </p>
              </div>

              <span className="text-sm text-slate-500">
                2 days ago
              </span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}