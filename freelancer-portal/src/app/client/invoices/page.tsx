"use client";

import { useState } from "react";
import Link from "next/link";

const initialInvoices = [
  {
    number: "INV-001",
    freelancer: "Rahul Sharma",
    company: "ABC Company",
    project: "E-commerce Website",
    issueDate: "01 Sep 2026",
    dueDate: "15 Sep 2026",
    amount: 25000,
    status: "Paid",
  },
  {
    number: "INV-002",
    freelancer: "Rahul Sharma",
    company: "ABC Company",
    project: "E-commerce Website",
    issueDate: "20 Sep 2026",
    dueDate: "05 Oct 2026",
    amount: 25000,
    status: "Pending",
  },
  {
    number: "INV-003",
    freelancer: "Priya Mehta",
    company: "XYZ Solutions",
    project: "Brand Identity Design",
    issueDate: "22 Sep 2026",
    dueDate: "06 Oct 2026",
    amount: 10000,
    status: "Pending",
  },
];

export default function ClientInvoicesPage() {
  const [invoices, setInvoices] = useState(initialInvoices);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      invoice.number.toLowerCase().includes(search.toLowerCase()) ||
      invoice.freelancer.toLowerCase().includes(search.toLowerCase()) ||
      invoice.project.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "All" || invoice.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalAmount = invoices.reduce(
    (total, invoice) => total + invoice.amount,
    0
  );

  const paidAmount = invoices
    .filter((invoice) => invoice.status === "Paid")
    .reduce((total, invoice) => total + invoice.amount, 0);

  const pendingAmount = invoices
    .filter((invoice) => invoice.status === "Pending")
    .reduce((total, invoice) => total + invoice.amount, 0);

  const handlePayment = (invoiceNumber: string) => {
    setInvoices((currentInvoices) =>
      currentInvoices.map((invoice) =>
        invoice.number === invoiceNumber
          ? { ...invoice, status: "Paid" }
          : invoice
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
          <h1 className="text-3xl font-bold">My Invoices</h1>

          <p className="text-slate-400 mt-2">
            View and manage invoices received from your freelancers.
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <p className="text-slate-400 text-sm">
              Total Invoices
            </p>

            <h2 className="text-3xl font-bold mt-2">
              {invoices.length}
            </h2>

            <p className="text-slate-500 text-sm mt-2">
              ₹{totalAmount.toLocaleString("en-IN")} total
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <p className="text-slate-400 text-sm">
              Paid Amount
            </p>

            <h2 className="text-3xl font-bold mt-2 text-green-400">
              ₹{paidAmount.toLocaleString("en-IN")}
            </h2>

            <p className="text-slate-500 text-sm mt-2">
              Successfully paid
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
              Awaiting payment
            </p>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              placeholder="Search invoice, freelancer or project..."
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
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
            </select>
          </div>
        </div>

        {/* Invoice Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800">
                <tr>
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
                    Due Date
                  </th>

                  <th className="text-left px-6 py-4 text-sm text-slate-400">
                    Amount
                  </th>

                  <th className="text-left px-6 py-4 text-sm text-slate-400">
                    Status
                  </th>

                  <th className="text-left px-6 py-4 text-sm text-slate-400">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredInvoices.map((invoice) => (
                  <tr
                    key={invoice.number}
                    className="border-t border-slate-800 hover:bg-slate-800/40"
                  >
                    <td className="px-6 py-5">
                      <p className="font-semibold">
                        {invoice.number}
                      </p>

                      <p className="text-xs text-slate-500 mt-1">
                        Issued {invoice.issueDate}
                      </p>
                    </td>

                    <td className="px-6 py-5">
                      <p className="font-medium">
                        {invoice.freelancer}
                      </p>

                      <p className="text-sm text-slate-500">
                        {invoice.company}
                      </p>
                    </td>

                    <td className="px-6 py-5 text-slate-300">
                      {invoice.project}
                    </td>

                    <td className="px-6 py-5 text-slate-400">
                      {invoice.dueDate}
                    </td>

                    <td className="px-6 py-5 font-semibold">
                      ₹{invoice.amount.toLocaleString("en-IN")}
                    </td>

                    <td className="px-6 py-5">
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

                    <td className="px-6 py-5">
                      {invoice.status === "Pending" ? (
                        <button
                          onClick={() =>
                            handlePayment(invoice.number)
                          }
                          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm font-medium"
                        >
                          Pay Now
                        </button>
                      ) : (
                        <button className="px-4 py-2 rounded-lg border border-slate-700 hover:bg-slate-800 text-sm">
                          View
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredInvoices.length === 0 && (
            <div className="p-10 text-center">
              <p className="text-slate-400">
                No invoices found.
              </p>
            </div>
          )}
        </div>

        {/* Information */}
        <div className="mt-6 bg-blue-500/10 border border-blue-500/20 rounded-xl p-5">
          <p className="text-blue-300 text-sm">
            <span className="font-semibold">Note:</span>{" "}
            Payment processing is currently simulated. Later,
            Razorpay or Stripe can be integrated to process real
            payments securely.
          </p>
        </div>
      </div>
    </main>
  );
}