import Link from "next/link";

export default function FreelancerDashboard() {
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


      {/* Main Layout */}
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
              active
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
            />

          </nav>


          {/* Profile */}
          <div className="absolute bottom-6 left-5 w-52 border-t border-slate-800 pt-4">

            <div className="flex items-center gap-3">

              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold">
                F
              </div>

              <div>
                <p className="text-sm font-medium">
                  Freelancer
                </p>

                <p className="text-xs text-slate-500">
                  freelancer@example.com
                </p>
              </div>

            </div>

          </div>

        </aside>


        {/* Dashboard Content */}
        <section className="flex-1 p-8">

          {/* Header */}
          <div className="flex items-center justify-between mb-8">

            <div>
              <h1 className="text-3xl font-bold">
                Dashboard
              </h1>

              <p className="text-slate-400 mt-2">
                Here's an overview of your freelance business.
              </p>
            </div>

            <Link
              href="/freelancer/invoices"
              className="px-5 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 font-medium"
            >
              + Create Invoice
            </Link>

          </div>


          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">

            <StatCard
              title="Total Clients"
              value="12"
              icon="👥"
              description="Active clients"
            />

            <StatCard
              title="Active Projects"
              value="8"
              icon="📁"
              description="Currently running"
            />

            <StatCard
              title="Pending Invoices"
              value="₹45,000"
              icon="🧾"
              description="Awaiting payment"
            />

            <StatCard
              title="Total Revenue"
              value="₹2,45,000"
              icon="💰"
              description="This year"
            />

          </div>


          {/* Main Cards */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

            {/* Recent Projects */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">

              <div className="flex items-center justify-between mb-6">

                <h2 className="text-xl font-semibold">
                  Recent Projects
                </h2>

                <Link
                  href="/freelancer/projects"
                  className="text-sm text-blue-400 hover:text-blue-300"
                >
                  View all
                </Link>

              </div>


              <div className="space-y-4">

                <ProjectRow
                  name="E-commerce Website"
                  client="ABC Company"
                  status="In Progress"
                />

                <ProjectRow
                  name="Brand Identity Design"
                  client="XYZ Solutions"
                  status="In Progress"
                />

                <ProjectRow
                  name="Mobile App UI"
                  client="Tech Startup"
                  status="Completed"
                />

              </div>

            </div>


            {/* Recent Invoices */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">

              <div className="flex items-center justify-between mb-6">

                <h2 className="text-xl font-semibold">
                  Recent Invoices
                </h2>

                <Link
                  href="/freelancer/invoices"
                  className="text-sm text-blue-400 hover:text-blue-300"
                >
                  View all
                </Link>

              </div>


              <div className="space-y-4">

                <InvoiceRow
                  invoice="#INV-001"
                  client="ABC Company"
                  amount="₹25,000"
                  status="Paid"
                />

                <InvoiceRow
                  invoice="#INV-002"
                  client="XYZ Solutions"
                  amount="₹18,000"
                  status="Pending"
                />

                <InvoiceRow
                  invoice="#INV-003"
                  client="Tech Startup"
                  amount="₹32,000"
                  status="Overdue"
                />

              </div>

            </div>

          </div>


          {/* Quick Actions */}
          <div className="mt-6 bg-slate-900 border border-slate-800 rounded-xl p-6">

            <h2 className="text-xl font-semibold mb-5">
              Quick Actions
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

              <QuickAction
                href="/freelancer/clients"
                icon="👥"
                label="Add Client"
              />

              <QuickAction
                href="/freelancer/projects"
                icon="📁"
                label="New Project"
              />

              <QuickAction
                href="/freelancer/invoices"
                icon="🧾"
                label="Create Invoice"
              />

              <QuickAction
                href="/freelancer/files"
                icon="📎"
                label="Upload File"
              />

            </div>

          </div>

        </section>

      </div>

    </main>
  );
}


/* Sidebar Link */

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


/* Statistics Card */

function StatCard({
  title,
  value,
  icon,
  description,
}: {
  title: string;
  value: string;
  icon: string;
  description: string;
}) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">

      <div className="flex items-center justify-between">

        <div>
          <p className="text-sm text-slate-400">
            {title}
          </p>

          <p className="text-2xl font-bold mt-2">
            {value}
          </p>

          <p className="text-xs text-slate-500 mt-2">
            {description}
          </p>
        </div>

        <div className="text-3xl">
          {icon}
        </div>

      </div>

    </div>
  );
}


/* Project Row */

function ProjectRow({
  name,
  client,
  status,
}: {
  name: string;
  client: string;
  status: string;
}) {
  return (
    <div className="flex items-center justify-between p-4 bg-slate-950 rounded-lg">

      <div>
        <p className="font-medium">
          {name}
        </p>

        <p className="text-sm text-slate-500 mt-1">
          {client}
        </p>
      </div>

      <span
        className={`text-xs px-3 py-1 rounded-full ${
          status === "Completed"
            ? "bg-green-500/10 text-green-400"
            : "bg-blue-500/10 text-blue-400"
        }`}
      >
        {status}
      </span>

    </div>
  );
}


/* Invoice Row */

function InvoiceRow({
  invoice,
  client,
  amount,
  status,
}: {
  invoice: string;
  client: string;
  amount: string;
  status: string;
}) {
  return (
    <div className="flex items-center justify-between p-4 bg-slate-950 rounded-lg">

      <div>
        <p className="font-medium">
          {invoice}
        </p>

        <p className="text-sm text-slate-500 mt-1">
          {client}
        </p>
      </div>

      <div className="text-right">

        <p className="font-medium">
          {amount}
        </p>

        <span
          className={`text-xs ${
            status === "Paid"
              ? "text-green-400"
              : status === "Overdue"
              ? "text-red-400"
              : "text-yellow-400"
          }`}
        >
          {status}
        </span>

      </div>

    </div>
  );
}


/* Quick Action */

function QuickAction({
  href,
  icon,
  label,
}: {
  href: string;
  icon: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="p-4 rounded-lg border border-slate-800 hover:border-blue-500 hover:bg-slate-800 transition text-center"
    >
      <div className="text-2xl mb-2">
        {icon}
      </div>

      <p className="text-sm font-medium">
        {label}
      </p>
    </Link>
  );
}