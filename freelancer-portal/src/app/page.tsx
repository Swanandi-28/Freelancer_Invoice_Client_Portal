import connectDB from "@/lib/mongodb";
import Link from "next/link";

await connectDB();

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">

      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-slate-800">
        <h1 className="text-2xl font-bold">
          Freelancer<span className="text-blue-500">Portal</span>
        </h1>

        <div className="flex gap-4">
          <Link
            href="/login"
            className="px-5 py-2 rounded-lg border border-slate-700 hover:bg-slate-800"
          >
            Login
          </Link>

          <Link
           href="/register" 
           className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-8 py-24 text-center">
        <div className="max-w-4xl mx-auto">

          <p className="inline-block px-4 py-2 mb-6 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
            Freelancer Management Platform
          </p>

          <h2 className="text-5xl md:text-6xl font-bold leading-tight">
            Manage Your Freelance Business
            <span className="text-blue-500"> In One Place</span>
          </h2>

          <p className="mt-6 text-lg text-slate-400 max-w-2xl mx-auto">
            Manage clients, projects, invoices, payments, files and
            communication through one simple platform.
          </p>

          <div className="mt-10 flex justify-center gap-4">

            <Link
              href="/register"
              className="px-7 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 font-medium"
            >
              I&apos;m a Freelancer
            </Link>

            <Link
              href="/register"
              className="px-7 py-3 rounded-lg border border-slate-700 hover:bg-slate-800 font-medium"
            >
              I&apos;m a Client
            </Link>

          </div>

        </div>
      </section>

      {/* Features */}
      <section className="px-8 pb-24">
        <div className="max-w-6xl mx-auto">

          <h2 className="text-3xl font-bold text-center mb-12">
            Everything You Need
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            <FeatureCard
              icon="👥"
              title="Client Management"
              description="Manage all your clients and their projects from one dashboard."
            />

            <FeatureCard
              icon="🧾"
              title="Invoice Management"
              description="Create, send and track professional invoices easily."
            />

            <FeatureCard
              icon="💳"
              title="Payment Tracking"
              description="Track paid, pending and overdue invoices."
            />

            <FeatureCard
              icon="📁"
              title="Project Management"
              description="Keep track of project progress, deadlines and budgets."
            />

            <FeatureCard
              icon="📎"
              title="File Sharing"
              description="Share project documents securely with clients."
            />

            <FeatureCard
              icon="🖥️"
              title="Client Portal"
              description="Give clients a dedicated space to manage their projects and invoices."
            />

          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8 text-center text-slate-500">
        © 2026 FreelancerPortal. All rights reserved.
      </footer>

    </main>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="p-6 rounded-xl border border-slate-800 bg-slate-900 hover:border-blue-500/50 transition">

      <div className="text-3xl mb-4">
        {icon}
      </div>

      <h3 className="text-xl font-semibold mb-2">
        {title}
      </h3>

      <p className="text-slate-400">
        {description}
      </p>

    </div>
  );
}