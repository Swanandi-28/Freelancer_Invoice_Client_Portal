"use client";

import { useState } from "react";
import Link from "next/link";

type Payment = {
  id: number;
  paymentId: string;
  invoice: string;
  client: string;
  project: string;
  amount: string;
  paymentDate: string;
  method: string;
  status: "Completed" | "Pending" | "Failed";
};

export default function PaymentsPage() {
  const [showForm, setShowForm] = useState(false);

  const [payments, setPayments] = useState<Payment[]>([
    {
      id: 1,
      paymentId: "PAY-001",
      invoice: "INV-001",
      client: "ABC Company",
      project: "E-commerce Website",
      amount: "₹50,000",
      paymentDate: "12 Sep 2026",
      method: "Bank Transfer",
      status: "Completed",
    },
    {
      id: 2,
      paymentId: "PAY-002",
      invoice: "INV-002",
      client: "XYZ Solutions",
      project: "Brand Identity Design",
      amount: "₹25,000",
      paymentDate: "18 Sep 2026",
      method: "UPI",
      status: "Pending",
    },
    {
      id: 3,
      paymentId: "PAY-003",
      invoice: "INV-003",
      client: "Tech Startup",
      project: "Mobile App UI",
      amount: "₹32,000",
      paymentDate: "20 Sep 2026",
      method: "Credit Card",
      status: "Failed",
    },
  ]);

  const [newPayment, setNewPayment] = useState({
    invoice: "",
    client: "",
    project: "",
    amount: "",
    paymentDate: "",
    method: "Bank Transfer",
  });

  function handleAddPayment(e: React.FormEvent) {
    e.preventDefault();

    if (
      !newPayment.invoice ||
      !newPayment.client ||
      !newPayment.project ||
      !newPayment.amount ||
      !newPayment.paymentDate
    ) {
      return;
    }

    const payment: Payment = {
      id: Date.now(),
      paymentId: `PAY-${String(payments.length + 1).padStart(3, "0")}`,
      invoice: newPayment.invoice,
      client: newPayment.client,
      project: newPayment.project,
      amount: `₹${newPayment.amount}`,
      paymentDate: newPayment.paymentDate,
      method: newPayment.method,
      status: "Completed",
    };

    setPayments([...payments, payment]);

    setNewPayment({
      invoice: "",
      client: "",
      project: "",
      amount: "",
      paymentDate: "",
      method: "Bank Transfer",
    });

    setShowForm(false);
  }

  const completedPayments = payments.filter(
    (payment) => payment.status === "Completed"
  );

  const totalReceived = completedPayments.reduce(
    (total, payment) =>
      total + Number(payment.amount.replace(/[₹,]/g, "")),
    0
  );

  const pendingPayments = payments.filter(
    (payment) => payment.status === "Pending"
  );

  const pendingAmount = pendingPayments.reduce(
    (total, payment) =>
      total + Number(payment.amount.replace(/[₹,]/g, "")),
    0
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
              active
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
                Payments
              </h1>

              <p className="text-slate-400 mt-2">
                Track payments received from your clients.
              </p>
            </div>

            <button
              onClick={() => setShowForm(!showForm)}
              className="px-5 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 font-medium"
            >
              + Record Payment
            </button>
          </div>

          {/* Payment Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
            <StatCard
              title="Total Received"
              value={`₹${totalReceived.toLocaleString("en-IN")}`}
              description="Completed payments"
              icon="💰"
            />

            <StatCard
              title="Pending Payments"
              value={`₹${pendingAmount.toLocaleString("en-IN")}`}
              description="Awaiting payment"
              icon="⏳"
            />

            <StatCard
              title="Transactions"
              value={payments.length.toString()}
              description="Total payment records"
              icon="💳"
            />
          </div>

          {/* Add Payment Form */}
          {showForm && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-8">
              <h2 className="text-xl font-semibold mb-6">
                Record New Payment
              </h2>

              <form
                onSubmit={handleAddPayment}
                className="grid grid-cols-1 md:grid-cols-2 gap-5"
              >
                {/* Invoice */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Invoice Number
                  </label>

                  <input
                    type="text"
                    value={newPayment.invoice}
                    onChange={(e) =>
                      setNewPayment({
                        ...newPayment,
                        invoice: e.target.value,
                      })
                    }
                    placeholder="INV-004"
                    className="w-full px-4 py-3 rounded-lg bg-slate-950 border border-slate-700 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Client */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Client
                  </label>

                  <input
                    type="text"
                    value={newPayment.client}
                    onChange={(e) =>
                      setNewPayment({
                        ...newPayment,
                        client: e.target.value,
                      })
                    }
                    placeholder="Client name"
                    className="w-full px-4 py-3 rounded-lg bg-slate-950 border border-slate-700 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Project */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Project
                  </label>

                  <input
                    type="text"
                    value={newPayment.project}
                    onChange={(e) =>
                      setNewPayment({
                        ...newPayment,
                        project: e.target.value,
                      })
                    }
                    placeholder="Project name"
                    className="w-full px-4 py-3 rounded-lg bg-slate-950 border border-slate-700 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Amount
                  </label>

                  <input
                    type="number"
                    value={newPayment.amount}
                    onChange={(e) =>
                      setNewPayment({
                        ...newPayment,
                        amount: e.target.value,
                      })
                    }
                    placeholder="50000"
                    className="w-full px-4 py-3 rounded-lg bg-slate-950 border border-slate-700 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Payment Date */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Payment Date
                  </label>

                  <input
                    type="date"
                    value={newPayment.paymentDate}
                    onChange={(e) =>
                      setNewPayment({
                        ...newPayment,
                        paymentDate: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 rounded-lg bg-slate-950 border border-slate-700 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Payment Method
                  </label>

                  <select
                    value={newPayment.method}
                    onChange={(e) =>
                      setNewPayment({
                        ...newPayment,
                        method: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 rounded-lg bg-slate-950 border border-slate-700 focus:outline-none focus:border-blue-500"
                  >
                    <option>Bank Transfer</option>
                    <option>UPI</option>
                    <option>Credit Card</option>
                    <option>Debit Card</option>
                    <option>Cash</option>
                    <option>Other</option>
                  </select>
                </div>

                {/* Buttons */}
                <div className="md:col-span-2 flex justify-end gap-3">
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
                    Record Payment
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <input
              type="text"
              placeholder="Search payments..."
              className="flex-1 px-4 py-3 rounded-lg bg-slate-900 border border-slate-800 focus:outline-none focus:border-blue-500"
            />

            <select className="px-4 py-3 rounded-lg bg-slate-900 border border-slate-800 focus:outline-none focus:border-blue-500">
              <option>All Status</option>
              <option>Completed</option>
              <option>Pending</option>
              <option>Failed</option>
            </select>
          </div>

          {/* Payments Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-800/60">
                  <tr>
                    <th className="text-left px-6 py-4 text-sm text-slate-400">
                      Payment
                    </th>

                    <th className="text-left px-6 py-4 text-sm text-slate-400">
                      Client
                    </th>

                    <th className="text-left px-6 py-4 text-sm text-slate-400">
                      Project
                    </th>

                    <th className="text-left px-6 py-4 text-sm text-slate-400">
                      Amount
                    </th>

                    <th className="text-left px-6 py-4 text-sm text-slate-400">
                      Date
                    </th>

                    <th className="text-left px-6 py-4 text-sm text-slate-400">
                      Method
                    </th>

                    <th className="text-left px-6 py-4 text-sm text-slate-400">
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {payments.map((payment) => (
                    <tr
                      key={payment.id}
                      className="border-t border-slate-800 hover:bg-slate-800/30"
                    >
                      <td className="px-6 py-5">
                        <p className="font-medium">
                          {payment.paymentId}
                        </p>

                        <p className="text-xs text-slate-500 mt-1">
                          {payment.invoice}
                        </p>
                      </td>

                      <td className="px-6 py-5 text-sm">
                        {payment.client}
                      </td>

                      <td className="px-6 py-5 text-sm text-slate-300">
                        {payment.project}
                      </td>

                      <td className="px-6 py-5 font-medium">
                        {payment.amount}
                      </td>

                      <td className="px-6 py-5 text-sm text-slate-300">
                        {payment.paymentDate}
                      </td>

                      <td className="px-6 py-5 text-sm text-slate-300">
                        {payment.method}
                      </td>

                      <td className="px-6 py-5">
                        <span
                          className={`inline-flex px-3 py-1 rounded-full text-xs ${
                            payment.status === "Completed"
                              ? "bg-green-500/10 text-green-400"
                              : payment.status === "Pending"
                              ? "bg-yellow-500/10 text-yellow-400"
                              : "bg-red-500/10 text-red-400"
                          }`}
                        >
                          {payment.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-5 text-sm text-slate-500">
            Showing {payments.length} payment records
          </div>
        </section>
      </div>
    </main>
  );
}

function StatCard({
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