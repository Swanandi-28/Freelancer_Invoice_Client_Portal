"use client";

import { useState } from "react";
import Link from "next/link";

const initialPayments = [
  {
    id: "PAY-001",
    invoice: "INV-001",
    freelancer: "Rahul Sharma",
    project: "E-commerce Website",
    amount: 25000,
    date: "12 Sep 2026",
    method: "Bank Transfer",
    status: "Completed",
  },
  {
    id: "PAY-002",
    invoice: "INV-004",
    freelancer: "Priya Mehta",
    project: "Brand Identity Design",
    amount: 15000,
    date: "18 Sep 2026",
    method: "UPI",
    status: "Completed",
  },
  {
    id: "PAY-003",
    invoice: "INV-005",
    freelancer: "Rahul Sharma",
    project: "E-commerce Website",
    amount: 10000,
    date: "25 Sep 2026",
    method: "Credit Card",
    status: "Pending",
  },
];

export default function ClientPaymentsPage() {
  const [payments, setPayments] = useState(initialPayments);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const filteredPayments = payments.filter((payment) => {
    const matchesSearch =
      payment.id.toLowerCase().includes(search.toLowerCase()) ||
      payment.invoice.toLowerCase().includes(search.toLowerCase()) ||
      payment.freelancer.toLowerCase().includes(search.toLowerCase()) ||
      payment.project.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "All" || payment.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const completedAmount = payments
    .filter((payment) => payment.status === "Completed")
    .reduce((total, payment) => total + payment.amount, 0);

  const pendingAmount = payments
    .filter((payment) => payment.status === "Pending")
    .reduce((total, payment) => total + payment.amount, 0);

  const totalPayments = payments.length;

  const markCompleted = (paymentId: string) => {
    setPayments((currentPayments) =>
      currentPayments.map((payment) =>
        payment.id === paymentId
          ? { ...payment, status: "Completed" }
          : payment
      )
    );
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

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Back */}
        <Link
          href="/client/dashboard"
          className="text-blue-400 hover:text-blue-300 text-sm"
        >
          ← Back to Dashboard
        </Link>

        {/* Heading */}
        <div className="mt-6 mb-8">
          <h1 className="text-3xl font-bold">Payment History</h1>

          <p className="text-slate-400 mt-2">
            View all payments made to your freelancers.
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <p className="text-slate-400 text-sm">
              Total Payments
            </p>

            <h2 className="text-3xl font-bold mt-2">
              {totalPayments}
            </h2>

            <p className="text-slate-500 text-sm mt-2">
              Recorded transactions
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <p className="text-slate-400 text-sm">
              Completed Amount
            </p>

            <h2 className="text-3xl font-bold mt-2 text-green-400">
              ₹{completedAmount.toLocaleString("en-IN")}
            </h2>

            <p className="text-slate-500 text-sm mt-2">
              Successfully processed
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <p className="text-slate-400 text-sm">
              Pending Amount
            </p>

            <h2 className="text-3xl font-bold mt-2 text-yellow-400">
              ₹{pendingAmount.toLocaleString("en-IN")}
            </h2>

            <p className="text-slate-500 text-sm mt-2">
              Awaiting confirmation
            </p>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              placeholder="Search payment, invoice, freelancer or project..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 px-4 py-3 rounded-lg bg-slate-950 border border-slate-700 focus:outline-none focus:border-blue-500"
            />

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 rounded-lg bg-slate-950 border border-slate-700 focus:outline-none focus:border-blue-500"
            >
              <option value="All">All Statuses</option>
              <option value="Completed">Completed</option>
              <option value="Pending">Pending</option>
            </select>
          </div>
        </div>

        {/* Payments Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800">
                <tr>
                  <th className="text-left px-6 py-4 text-sm text-slate-400">
                    Payment
                  </th>

                  <th className="text-left px-6 py-4 text-sm text-slate-400">
                    Invoice
                  </th>

                  <th className="text-left px-6 py-4 text-sm text-slate-400">
                    Freelancer
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
                {filteredPayments.map((payment) => (
                  <tr
                    key={payment.id}
                    className="border-t border-slate-800 hover:bg-slate-800/40"
                  >
                    <td className="px-6 py-5">
                      <p className="font-semibold">
                        {payment.id}
                      </p>
                    </td>

                    <td className="px-6 py-5 text-blue-400">
                      {payment.invoice}
                    </td>

                    <td className="px-6 py-5">
                      {payment.freelancer}
                    </td>

                    <td className="px-6 py-5 text-slate-400">
                      {payment.project}
                    </td>

                    <td className="px-6 py-5 font-semibold">
                      ₹{payment.amount.toLocaleString("en-IN")}
                    </td>

                    <td className="px-6 py-5 text-slate-400">
                      {payment.date}
                    </td>

                    <td className="px-6 py-5 text-slate-400">
                      {payment.method}
                    </td>

                    <td className="px-6 py-5">
                      {payment.status === "Completed" ? (
                        <span className="px-3 py-1 rounded-full text-sm bg-green-500/10 text-green-400">
                          Completed
                        </span>
                      ) : (
                        <button
                          onClick={() => markCompleted(payment.id)}
                          className="px-3 py-1 rounded-full text-sm bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20"
                        >
                          Pending
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredPayments.length === 0 && (
            <div className="p-10 text-center">
              <p className="text-slate-400">
                No payments found.
              </p>
            </div>
          )}
        </div>

        {/* Payment Information */}
        <div className="mt-6 bg-blue-500/10 border border-blue-500/20 rounded-xl p-5">
          <p className="text-blue-300 text-sm">
            <span className="font-semibold">Payment Information:</span>{" "}
            Payment records shown here are currently sample data.
            Once MongoDB and the payment gateway are connected,
            completed transactions will be recorded automatically.
          </p>
        </div>
      </div>
    </main>
  );
}