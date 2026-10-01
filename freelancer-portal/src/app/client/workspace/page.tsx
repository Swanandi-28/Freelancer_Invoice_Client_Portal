"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

const projects = [
  {
    name: "E-commerce Website",
    description: "Development of an online shopping website.",
    status: "In Progress",
    budget: "₹50,000",
    deadline: "30 Oct 2026",
  },
];

const invoices = [
  {
    number: "INV-001",
    date: "01 Sep 2026",
    dueDate: "15 Sep 2026",
    amount: "₹25,000",
    status: "Paid",
  },
  {
    number: "INV-002",
    date: "20 Sep 2026",
    dueDate: "05 Oct 2026",
    amount: "₹25,000",
    status: "Pending",
  },
];

const files = [
  {
    name: "project-requirements.pdf",
    type: "PDF",
    size: "1.2 MB",
  },
  {
    name: "homepage-design.fig",
    type: "Design",
    size: "4.8 MB",
  },
];

export default function ClientWorkspace() {
  const searchParams = useSearchParams();

  const freelancerId = searchParams.get("freelancer");

  const freelancer =
    freelancerId === "2"
      ? {
          name: "Priya Mehta",
          company: "XYZ Solutions",
          project: "Brand Identity Design",
        }
      : {
          name: "Rahul Sharma",
          company: "ABC Company",
          project: "E-commerce Website",
        };

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
              ABC Company
            </span>

            <button className="px-4 py-2 rounded-lg border border-slate-700 hover:bg-slate-800">
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Back */}
        <Link
          href="/client/dashboard"
          className="text-blue-400 hover:text-blue-300 text-sm"
        >
          ← Back to Dashboard
        </Link>

        {/* Workspace Header */}
        <div className="mt-6 bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">

            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center text-xl font-bold">
                {freelancer.name.charAt(0)}
              </div>

              <div>
                <p className="text-sm text-slate-400">
                  Private Workspace
                </p>

                <h1 className="text-2xl font-bold">
                  {freelancer.name}
                </h1>

                <p className="text-slate-400">
                  {freelancer.company}
                </p>
              </div>
            </div>

            <span className="px-4 py-2 rounded-full bg-green-500/10 text-green-400 text-sm">
              Active Relationship
            </span>
          </div>
        </div>

        {/* Navigation */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-8">

          <button className="bg-blue-600 rounded-xl p-4 text-left">
            <p className="text-sm text-blue-100">Workspace</p>
            <p className="font-semibold mt-1">Overview</p>
          </button>

          <button className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-left hover:bg-slate-800">
            <p className="text-sm text-slate-400">View</p>
            <p className="font-semibold mt-1">Invoices</p>
          </button>

          <button className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-left hover:bg-slate-800">
            <p className="text-sm text-slate-400">View</p>
            <p className="font-semibold mt-1">Payments</p>
          </button>

          <button className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-left hover:bg-slate-800">
            <p className="text-sm text-slate-400">View</p>
            <p className="font-semibold mt-1">Files</p>
          </button>

          <button className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-left hover:bg-slate-800">
            <p className="text-sm text-slate-400">Contact</p>
            <p className="font-semibold mt-1">Messages</p>
          </button>

        </div>

        {/* Project */}
        <section className="mt-10">
          <h2 className="text-2xl font-bold mb-5">
            Current Project
          </h2>

          {projects.map((project) => (
            <div
              key={project.name}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">

                <div>
                  <h3 className="text-xl font-semibold">
                    {freelancer.project}
                  </h3>

                  <p className="text-slate-400 mt-2">
                    {project.description}
                  </p>
                </div>

                <span className="px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-400 text-sm w-fit">
                  {project.status}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mt-6 pt-6 border-t border-slate-800">

                <div>
                  <p className="text-sm text-slate-400">
                    Project Budget
                  </p>
                  <p className="text-lg font-semibold mt-1">
                    {project.budget}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-400">
                    Deadline
                  </p>
                  <p className="text-lg font-semibold mt-1">
                    {project.deadline}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-400">
                    Freelancer
                  </p>
                  <p className="text-lg font-semibold mt-1">
                    {freelancer.name}
                  </p>
                </div>

              </div>
            </div>
          ))}
        </section>

        {/* Invoices */}
        <section className="mt-10">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-2xl font-bold">
              Recent Invoices
            </h2>

            <button className="text-blue-400 hover:text-blue-300">
              View All
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-800">
                  <tr>
                    <th className="text-left px-6 py-4 text-sm text-slate-400">
                      Invoice
                    </th>

                    <th className="text-left px-6 py-4 text-sm text-slate-400">
                      Date
                    </th>

                    <th className="text-left px-6 py-4 text-sm text-slate-400">
                      Due Date
                    </th>

                    <th className="text-left px-6 py-4 text-sm text-slate-400">
                      Amount
                    </th>

                    <th className="text-left px-6 py-4 text-sm text-slate-400">
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {invoices.map((invoice) => (
                    <tr
                      key={invoice.number}
                      className="border-t border-slate-800"
                    >
                      <td className="px-6 py-4 font-medium">
                        {invoice.number}
                      </td>

                      <td className="px-6 py-4 text-slate-400">
                        {invoice.date}
                      </td>

                      <td className="px-6 py-4 text-slate-400">
                        {invoice.dueDate}
                      </td>

                      <td className="px-6 py-4 font-medium">
                        {invoice.amount}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-sm ${
                            invoice.status === "Paid"
                              ? "bg-green-500/10 text-green-400"
                              : "bg-yellow-500/10 text-yellow-400"
                          }`}
                        >
                          {invoice.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Files */}
        <section className="mt-10">
          <h2 className="text-2xl font-bold mb-5">
            Shared Files
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {files.map((file) => (
              <div
                key={file.name}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center justify-between"
              >
                <div>
                  <p className="font-medium">{file.name}</p>

                  <p className="text-sm text-slate-400 mt-1">
                    {file.type} • {file.size}
                  </p>
                </div>

                <button className="px-4 py-2 rounded-lg border border-slate-700 hover:bg-slate-800 text-sm">
                  Download
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Messages */}
        <section className="mt-10">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">

            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">
                  Messages
                </h2>

                <p className="text-slate-400 mt-1">
                  Communicate with {freelancer.name}
                </p>
              </div>

              <button className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700">
                Open Messages
              </button>
            </div>

            <div className="mt-6 p-4 bg-slate-950 rounded-xl">
              <p className="font-medium">
                {freelancer.name}
              </p>

              <p className="text-slate-400 text-sm mt-1">
                The latest project updates are ready for your review.
              </p>
            </div>

          </div>
        </section>

      </div>
    </main>
  );
}