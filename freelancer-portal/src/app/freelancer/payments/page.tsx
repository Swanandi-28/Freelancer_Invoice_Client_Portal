"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Invoice = { _id: string; invoiceNumber: string; amount: number; client: { _id: string; company: string }; project: { _id: string; name: string } };
type Payment = { _id: string; invoice?: { invoiceNumber: string }; client?: { name: string; company: string }; project?: { name: string }; amount: number; paymentDate: string; paymentMethod: string; status: "Completed" | "Pending" };

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invoiceId, setInvoiceId] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [method, setMethod] = useState("Bank Transfer");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function loadData() {
    const [paymentsResponse, invoicesResponse] = await Promise.all([fetch("/api/payments"), fetch("/api/invoices")]);
    const paymentsData = await paymentsResponse.json();
    const invoicesData = await invoicesResponse.json();
    if (!paymentsResponse.ok) throw new Error(paymentsData.message || "Could not load payments.");
    if (!invoicesResponse.ok) throw new Error(invoicesData.message || "Could not load invoices.");
    setPayments(paymentsData.payments);
    setInvoices(invoicesData.invoices.filter((invoice: Invoice & { status: string }) => invoice.status !== "Paid"));
  }

  useEffect(() => {
    loadData().catch((error: Error) => setMessage(error.message));
  }, []);

  async function handleAddPayment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const invoice = invoices.find((item) => item._id === invoiceId);
    if (!invoice || !paymentDate) return;
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: invoice.client._id, projectId: invoice.project._id, invoiceId, amount: invoice.amount, paymentDate, paymentMethod: method, status: "Completed" }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to record payment.");
      setMessage("Payment recorded successfully.");
      setInvoiceId("");
      setPaymentDate("");
      setShowForm(false);
      await loadData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  }

  const visiblePayments = payments.filter((payment) => {
    const query = `${payment.invoice?.invoiceNumber} ${payment.client?.name} ${payment.client?.company} ${payment.project?.name}`.toLowerCase();
    return query.includes(search.toLowerCase()) && (statusFilter === "All Status" || payment.status === statusFilter);
  });
  const received = payments.filter((payment) => payment.status === "Completed").reduce((sum, payment) => sum + payment.amount, 0);
  const pending = payments.filter((payment) => payment.status === "Pending").reduce((sum, payment) => sum + payment.amount, 0);

  return <main className="min-h-screen bg-slate-950 text-white">
    <nav className="h-16 border-b border-slate-800 bg-slate-900 flex items-center justify-between px-6"><Link href="/" className="text-xl font-bold">Freelancer<span className="text-blue-500">Portal</span></Link><Link href="/login" className="text-sm text-slate-400 hover:text-white">Logout</Link></nav>
    <div className="flex">
      <aside className="w-64 min-h-[calc(100vh-4rem)] border-r border-slate-800 bg-slate-900 p-5"><h2 className="text-lg font-semibold mb-6">Freelancer</h2><nav className="space-y-2">{[["Dashboard", "/freelancer/dashboard"], ["Clients", "/freelancer/clients"], ["Projects", "/freelancer/projects"], ["Invoices", "/freelancer/invoices"], ["Payments", "/freelancer/payments"], ["Files", "/freelancer/files"], ["Messages", "/freelancer/messages"], ["Reports", "/freelancer/reports"]].map(([label, href]) => <Link key={href} href={href} className={`block px-4 py-3 rounded-lg text-sm ${href.endsWith("payments") ? "bg-blue-600" : "text-slate-400 hover:bg-slate-800"}`}>{label}</Link>)}</nav></aside>
      <section className="flex-1 p-8"><div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8"><div><h1 className="text-3xl font-bold">Payments</h1><p className="text-slate-400 mt-2">Track payments received from your clients.</p></div><button onClick={() => setShowForm(!showForm)} className="px-5 py-3 rounded-lg bg-blue-600 hover:bg-blue-700">+ Record Payment</button></div>
        {message && <p role="status" className="mb-5 text-sm text-blue-300">{message}</p>}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8"><StatCard title="Total Received" value={`₹${received.toLocaleString("en-IN")}`} /><StatCard title="Pending Payments" value={`₹${pending.toLocaleString("en-IN")}`} /><StatCard title="Transactions" value={String(payments.length)} /></div>
        {showForm && <form onSubmit={handleAddPayment} className="grid grid-cols-1 md:grid-cols-3 gap-5 bg-slate-900 border border-slate-800 rounded-xl p-6 mb-8"><label className="text-sm">Unpaid Invoice<select required value={invoiceId} onChange={(event) => setInvoiceId(event.target.value)} className="mt-2 w-full px-4 py-3 rounded-lg bg-slate-950 border border-slate-700"><option value="">Select invoice</option>{invoices.map((invoice) => <option key={invoice._id} value={invoice._id}>{invoice.invoiceNumber} · {invoice.client.company} · ₹{invoice.amount.toLocaleString("en-IN")}</option>)}</select></label><label className="text-sm">Payment Date<input required type="date" value={paymentDate} onChange={(event) => setPaymentDate(event.target.value)} className="mt-2 w-full px-4 py-3 rounded-lg bg-slate-950 border border-slate-700" /></label><label className="text-sm">Method<select value={method} onChange={(event) => setMethod(event.target.value)} className="mt-2 w-full px-4 py-3 rounded-lg bg-slate-950 border border-slate-700"><option>Bank Transfer</option><option>UPI</option><option>Card</option><option>Cash</option><option>Other</option></select></label><div className="md:col-span-3 flex justify-end gap-3"><button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-slate-700 rounded-lg">Cancel</button><button disabled={loading || invoices.length === 0} className="px-4 py-2 bg-blue-600 rounded-lg disabled:opacity-50">{loading ? "Recording..." : "Record Payment"}</button></div></form>}
        <div className="flex flex-col md:flex-row gap-4 mb-6"><input type="search" placeholder="Search payments..." value={search} onChange={(event) => setSearch(event.target.value)} className="flex-1 px-4 py-3 rounded-lg bg-slate-900 border border-slate-800" /><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="px-4 py-3 rounded-lg bg-slate-900 border border-slate-800"><option>All Status</option><option>Completed</option><option>Pending</option></select></div>
        <div className="overflow-x-auto bg-slate-900 border border-slate-800 rounded-xl"><table className="w-full"><thead className="bg-slate-800/60"><tr>{["Payment", "Client", "Project", "Amount", "Date", "Method", "Status"].map((heading) => <th key={heading} className="text-left px-5 py-4 text-sm text-slate-400">{heading}</th>)}</tr></thead><tbody>{visiblePayments.map((payment) => <tr key={payment._id} className="border-t border-slate-800"><td className="px-5 py-4"><div>{payment._id.slice(-8).toUpperCase()}</div><div className="text-xs text-slate-500">{payment.invoice?.invoiceNumber}</div></td><td className="px-5 py-4">{payment.client?.company || payment.client?.name}</td><td className="px-5 py-4">{payment.project?.name}</td><td className="px-5 py-4">₹{payment.amount.toLocaleString("en-IN")}</td><td className="px-5 py-4">{new Date(payment.paymentDate).toLocaleDateString("en-IN")}</td><td className="px-5 py-4">{payment.paymentMethod}</td><td className="px-5 py-4">{payment.status}</td></tr>)}</tbody></table>{visiblePayments.length === 0 && <p className="p-8 text-center text-slate-400">No payment records found.</p>}</div>
      </section>
    </div>
  </main>;
}

function StatCard({ title, value }: { title: string; value: string }) {
  return <div className="bg-slate-900 border border-slate-800 rounded-xl p-6"><p className="text-sm text-slate-400">{title}</p><p className="text-2xl font-bold mt-2">{value}</p></div>;
}
