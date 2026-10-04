"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  Card,
  EmptyState,
  ErrorBanner,
  LoadingState,
  PageHeader,
  StatCard,
  StatusBadge,
  formatCurrency,
  formatDate,
  inputClass,
  tdClass,
  thClass,
} from "@/components/ui";

type Named = { _id: string; name?: string; company?: string };

type Invoice = {
  _id: string;
  invoiceNumber: string;
  amount: number;
  paidAmount: number;
  pendingAmount: number;
  // Remaining budget of the invoice's project (from the server)
  projectPendingAmount?: number;
  status: "Draft" | "Pending" | "Paid" | "Overdue";
  client?: Named;
  project?: Named;
};

type Payment = {
  _id: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  status: "Completed" | "Pending";
  client?: Named;
  project?: Named;
  invoice?: { _id: string; invoiceNumber: string; status: string };
  // Totals of the WHOLE invoice, calculated by the server:
  invoiceAmount: number;
  paidAmount: number;
  pendingAmount: number;
};

const PAYMENT_METHODS = ["Bank Transfer", "UPI", "Cash", "Card", "Other"];

const todayInput = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
};

export default function FreelancerPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  const [invoiceId, setInvoiceId] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(todayInput());
  const [method, setMethod] = useState("Bank Transfer");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState("");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [paymentsResponse, invoicesResponse] = await Promise.all([
        fetch("/api/payments", { cache: "no-store" }),
        fetch("/api/invoices", { cache: "no-store" }),
      ]);

      const paymentsData = await paymentsResponse.json();
      const invoicesData = await invoicesResponse.json();

      if (!paymentsResponse.ok) {
        throw new Error(paymentsData.message || "Could not load payments.");
      }
      if (!invoicesResponse.ok) {
        throw new Error(invoicesData.message || "Could not load invoices.");
      }

      setPayments(paymentsData.payments || []);
      setInvoices(invoicesData.invoices || []);
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Could not load payments."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Only invoices that still have a pending amount can receive a payment.
  const payableInvoices = useMemo(
    () => invoices.filter((invoice) => invoice.pendingAmount > 0),
    [invoices]
  );

  const selectedInvoice = payableInvoices.find(
    (invoice) => invoice._id === invoiceId
  );

  const handleInvoiceChange = (id: string) => {
    setInvoiceId(id);
    setFormError("");

    // Suggest the full pending amount (as reported by the server).
    const invoice = payableInvoices.find((item) => item._id === id);
    // Suggest the most that can be accepted: limited by the invoice's
    // pending amount AND by the project's remaining budget.
    setAmount(
      invoice
        ? String(
            Math.min(
              invoice.pendingAmount,
              invoice.projectPendingAmount ?? invoice.pendingAmount
            )
          )
        : ""
    );
  };

  const handleRecordPayment = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError("");
    setSuccess("");

    if (!selectedInvoice) {
      setFormError("Please select an invoice.");
      return;
    }

    const value = Number(amount);

    if (!Number.isFinite(value) || value <= 0) {
      setFormError("Payment amount must be greater than 0.");
      return;
    }

    if (!paymentDate) {
      setFormError("Please select a payment date.");
      return;
    }

    try {
      setSaving(true);

      // The server re-checks ownership and the pending amount,
      // and rejects any overpayment.
      const response = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId: selectedInvoice._id,
          amount: value,
          paymentDate,
          paymentMethod: method,
          status: "Completed",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setFormError(data.message || "Failed to record payment.");
        return;
      }

      setSuccess(data.message || "Payment recorded successfully.");
      setInvoiceId("");
      setAmount("");
      setPaymentDate(todayInput());
      setShowForm(false);
      await loadData();
    } catch {
      setFormError("Unable to connect to the server.");
    } finally {
      setSaving(false);
    }
  };

  const visiblePayments = payments.filter((payment) => {
    const haystack = [
      payment.invoice?.invoiceNumber,
      payment.client?.name,
      payment.client?.company,
      payment.project?.name,
      payment.paymentMethod,
    ]
      .join(" ")
      .toLowerCase();

    return (
      haystack.includes(search.toLowerCase()) &&
      (statusFilter === "All" || payment.status === statusFilter)
    );
  });

  // Summary values are sums of the server-calculated invoice figures.
  const activeInvoices = invoices.filter((invoice) => invoice.status !== "Draft");
  const totalReceived = activeInvoices.reduce(
    (total, invoice) => total + invoice.paidAmount,
    0
  );
  const totalPending = activeInvoices.reduce(
    (total, invoice) => total + invoice.pendingAmount,
    0
  );

  return (
    <div className="p-4 md:p-8">
      <PageHeader
        title="Payments"
        subtitle="Record payments against invoices and track what is still pending."
        action={
          <button
            onClick={() => {
              setShowForm(!showForm);
              setFormError("");
              setSuccess("");
            }}
            className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-medium transition hover:bg-blue-500"
          >
            {showForm ? "Close" : "+ Record Payment"}
          </button>
        }
      />

      <ErrorBanner message={error} onRetry={loadData} />

      {success && (
        <div className="mb-6 rounded-lg border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-400">
          {success}
        </div>
      )}

      <div className="mb-8 grid gap-5 sm:grid-cols-3">
        <StatCard
          title="Total Received"
          value={loading ? "..." : formatCurrency(totalReceived)}
          hint="Completed payments"
        />
        <StatCard
          title="Pending on Invoices"
          value={loading ? "..." : formatCurrency(totalPending)}
          hint="Invoice amount − completed payments"
        />
        <StatCard
          title="Transactions"
          value={loading ? "..." : payments.length}
          hint="Payments recorded"
        />
      </div>

      {showForm && (
        <form
          onSubmit={handleRecordPayment}
          className="mb-8 rounded-2xl border border-white/10 bg-[#111827] p-6"
        >
          <h2 className="mb-5 text-lg font-semibold">Record Payment</h2>

          {!loading && payableInvoices.length === 0 ? (
            <p className="text-sm text-gray-400">
              There are no invoices with a pending amount. Create an invoice
              first, or all invoices are already fully paid.
            </p>
          ) : (
            <>
              <div className="grid gap-5 md:grid-cols-2">
                <label className="block text-sm text-gray-400">
                  Invoice
                  <select
                    required
                    value={invoiceId}
                    onChange={(event) => handleInvoiceChange(event.target.value)}
                    className={`${inputClass} mt-2`}
                  >
                    <option value="">Select invoice</option>
                    {payableInvoices.map((invoice) => (
                      <option key={invoice._id} value={invoice._id}>
                        {invoice.invoiceNumber} ·{" "}
                        {invoice.client?.company || invoice.client?.name} ·{" "}
                        {invoice.project?.name} · Pending{" "}
                        {formatCurrency(invoice.pendingAmount)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block text-sm text-gray-400">
                  Amount (₹)
                  <input
                    required
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    placeholder="20000"
                    className={`${inputClass} mt-2`}
                  />
                </label>

                <label className="block text-sm text-gray-400">
                  Payment Date
                  <input
                    required
                    type="date"
                    value={paymentDate}
                    onChange={(event) => setPaymentDate(event.target.value)}
                    className={`${inputClass} mt-2`}
                  />
                </label>

                <label className="block text-sm text-gray-400">
                  Method
                  <select
                    value={method}
                    onChange={(event) => setMethod(event.target.value)}
                    className={`${inputClass} mt-2`}
                  >
                    {PAYMENT_METHODS.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </label>
              </div>

              {selectedInvoice && (
                <div className="mt-5 grid gap-4 rounded-lg border border-white/10 bg-white/5 p-4 text-sm sm:grid-cols-3">
                  <div>
                    <p className="text-gray-500">Invoice Amount</p>
                    <p className="mt-1 font-semibold">
                      {formatCurrency(selectedInvoice.amount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Already Paid</p>
                    <p className="mt-1 font-semibold text-green-400">
                      {formatCurrency(selectedInvoice.paidAmount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Pending</p>
                    <p className="mt-1 font-semibold text-yellow-400">
                      {formatCurrency(selectedInvoice.pendingAmount)}
                    </p>
                  </div>
                </div>
              )}

              {formError && (
                <p role="alert" className="mt-4 text-sm text-red-400">
                  {formError}
                </p>
              )}

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-lg border border-white/10 px-5 py-2.5 text-sm hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium transition hover:bg-blue-500 disabled:opacity-50"
                >
                  {saving ? "Recording..." : "Record Payment"}
                </button>
              </div>
            </>
          )}
        </form>
      )}

      <div className="mb-6 flex flex-col gap-4 md:flex-row">
        <input
          type="search"
          placeholder="Search invoice, client, project or method..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className={`${inputClass} flex-1`}
        />
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className={`${inputClass} md:w-48`}
        >
          <option value="All">All Status</option>
          <option value="Completed">Completed</option>
          <option value="Pending">Pending</option>
        </select>
      </div>

      <Card>
        {loading ? (
          <LoadingState label="Loading payments..." />
        ) : visiblePayments.length === 0 ? (
          <EmptyState
            message={
              payments.length === 0
                ? "No payments recorded."
                : "No payments match your search."
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-white/10 bg-white/5">
                <tr>
                  {[
                    "Payment",
                    "Client",
                    "Project",
                    "Invoice Amount",
                    "Paid",
                    "Pending",
                    "Date",
                    "Method",
                    "Status",
                  ].map((heading) => (
                    <th key={heading} className={thClass}>
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visiblePayments.map((payment) => (
                  <tr
                    key={payment._id}
                    className="border-b border-white/5 last:border-0 hover:bg-white/5"
                  >
                    <td className={tdClass}>
                      <p className="font-medium">
                        {formatCurrency(payment.amount)}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {payment.invoice?.invoiceNumber || "Invoice removed"}
                      </p>
                    </td>
                    <td className={`${tdClass} text-gray-300`}>
                      {payment.client?.company || payment.client?.name || "-"}
                    </td>
                    <td className={`${tdClass} text-gray-300`}>
                      {payment.project?.name || "-"}
                    </td>
                    <td className={tdClass}>
                      {formatCurrency(payment.invoiceAmount)}
                    </td>
                    <td className={`${tdClass} text-green-400`}>
                      {formatCurrency(payment.paidAmount)}
                    </td>
                    <td className={`${tdClass} text-yellow-400`}>
                      {formatCurrency(payment.pendingAmount)}
                    </td>
                    <td className={`${tdClass} text-gray-400`}>
                      {formatDate(payment.paymentDate)}
                    </td>
                    <td className={`${tdClass} text-gray-400`}>
                      {payment.paymentMethod}
                    </td>
                    <td className={tdClass}>
                      <StatusBadge status={payment.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <p className="mt-4 text-xs text-gray-500">
        Invoice Amount, Paid and Pending are the totals of the whole invoice:
        Pending = Invoice Amount − all completed payments for that invoice.
      </p>
    </div>
  );
}
