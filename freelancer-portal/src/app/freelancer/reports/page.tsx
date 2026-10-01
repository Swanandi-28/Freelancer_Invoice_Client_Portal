"use client";

import Link from "next/link";

const monthlyData = [
  { month: "Apr", revenue: 35000, invoices: 4 },
  { month: "May", revenue: 48000, invoices: 5 },
  { month: "Jun", revenue: 42000, invoices: 4 },
  { month: "Jul", revenue: 62000, invoices: 7 },
  { month: "Aug", revenue: 58000, invoices: 6 },
  { month: "Sep", revenue: 75000, invoices: 8 },
];

const projectData = [
  {
    project: "E-commerce Website",
    client: "ABC Company",
    budget: "₹50,000",
    received: "₹50,000",
    status: "Completed",
  },
  {
    project: "Brand Identity Design",
    client: "XYZ Solutions",
    budget: "₹25,000",
    received: "₹15,000",
    status: "In Progress",
  },
  {
    project: "Mobile App UI",
    client: "Tech Startup",
    budget: "₹32,000",
    received: "₹20,000",
    status: "In Progress",
  },
];

export default function ReportsPage() {
  const totalRevenue = monthlyData.reduce(
    (total, item) => total + item.revenue,
    0
  );

  const totalInvoices = monthlyData.reduce(
    (total, item) => total + item.invoices,
    0
  );

  const maxRevenue = Math.max(
    ...monthlyData.map((item) => item.revenue)
  );

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      {/* Top Navbar */}
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
              active
            />
          </nav>
        </aside>

        {/* Main Content */}
        <section className="flex-1 p-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold">
                Reports
              </h1>

              <p className="text-slate-400 mt-2">
                View your freelance business performance.
              </p>
            </div>

            <select className="px-4 py-3 rounded-lg bg-slate-900 border border-slate-800 focus:outline-none focus:border-blue-500">
              <option>Last 6 Months</option>
              <option>This Year</option>
              <option>Last Year</option>
            </select>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
            <ReportCard
              title="Total Revenue"
              value={`₹${totalRevenue.toLocaleString("en-IN")}`}
              description="Last 6 months"
              icon="💰"
            />

            <ReportCard
              title="Total Invoices"
              value={totalInvoices.toString()}
              description="Invoices created"
              icon="🧾"
            />

            <ReportCard
              title="Average Invoice"
              value={`₹${Math.round(
                totalRevenue / totalInvoices
              ).toLocaleString("en-IN")}`}
              description="Average invoice value"
              icon="📊"
            />
          </div>

          {/* Revenue Chart */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-xl font-semibold">
                  Revenue Overview
                </h2>

                <p className="text-sm text-slate-500 mt-1">
                  Monthly revenue for the last 6 months
                </p>
              </div>

              <span className="text-sm text-green-400">
                Revenue Trend
              </span>
            </div>

            <div className="h-72 flex items-end gap-4 md:gap-8 border-b border-slate-800 px-2">
              {monthlyData.map((item) => {
                const height =
                  (item.revenue / maxRevenue) * 100;

                return (
                  <div
                    key={item.month}
                    className="flex-1 h-full flex flex-col justify-end items-center gap-3"
                  >
                    <span className="text-xs text-slate-400">
                      ₹
                      {(
                        item.revenue / 1000
                      ).toFixed(0)}
                      k
                    </span>

                    <div
                      className="w-full max-w-14 bg-blue-600 rounded-t-lg hover:bg-blue-500 transition"
                      style={{
                        height: `${height}%`,
                      }}
                    />

                    <span className="text-xs text-slate-500">
                      {item.month}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Project Performance */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="p-6 border-b border-slate-800">
              <h2 className="text-xl font-semibold">
                Project Performance
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                Financial summary by project
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-800/60">
                  <tr>
                    <th className="text-left px-6 py-4 text-sm text-slate-400">
                      Project
                    </th>

                    <th className="text-left px-6 py-4 text-sm text-slate-400">
                      Client
                    </th>

                    <th className="text-left px-6 py-4 text-sm text-slate-400">
                      Budget
                    </th>

                    <th className="text-left px-6 py-4 text-sm text-slate-400">
                      Received
                    </th>

                    <th className="text-left px-6 py-4 text-sm text-slate-400">
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {projectData.map((item) => (
                    <tr
                      key={item.project}
                      className="border-t border-slate-800 hover:bg-slate-800/30"
                    >
                      <td className="px-6 py-5 font-medium">
                        {item.project}
                      </td>

                      <td className="px-6 py-5 text-sm text-slate-300">
                        {item.client}
                      </td>

                      <td className="px-6 py-5 text-sm">
                        {item.budget}
                      </td>

                      <td className="px-6 py-5 text-sm text-green-400">
                        {item.received}
                      </td>

                      <td className="px-6 py-5">
                        <span
                          className={`px-3 py-1 rounded-full text-xs ${
                            item.status === "Completed"
                              ? "bg-green-500/10 text-green-400"
                              : "bg-blue-500/10 text-blue-400"
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Report Note */}
          <div className="mt-6 bg-blue-500/5 border border-blue-500/20 rounded-xl p-5">
            <p className="text-sm text-slate-400">
              <span className="text-blue-400 font-medium">
                Note:
              </span>{" "}
              These reports currently use sample data. Once MongoDB
              integration is completed, these values will be calculated
              automatically from your projects, invoices, and payments.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

function ReportCard({
  title,
  value,
  description,
  icon,
}: {
  title: string;
  value: string;
  description: string;
  icon: string;
}) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-400">
            {title}
          </p>

          <h2 className="text-2xl font-bold mt-2">
            {value}
          </h2>

          <p className="text-xs text-slate-500 mt-2">
            {description}
          </p>
        </div>

        <div className="text-2xl">
          {icon}
        </div>
      </div>
    </div>
  );
}

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