"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

type Role = "freelancer" | "client" | "admin";

const homeFor = (role: string) =>
  role === "admin" ? "/admin/freelancers" : `/${role}/dashboard`;

const NAVIGATION: Record<Role, { label: string; href: string }[]> = {
  freelancer: [
    { label: "Dashboard", href: "/freelancer/dashboard" },
    { label: "Clients", href: "/freelancer/clients" },
    { label: "Projects", href: "/freelancer/projects" },
    { label: "Invoices", href: "/freelancer/invoices" },
    { label: "Payments", href: "/freelancer/payments" },
    { label: "Files", href: "/freelancer/files" },
    { label: "Messages", href: "/freelancer/messages" },
    { label: "Reports", href: "/freelancer/reports" },
  ],
  client: [
    { label: "Dashboard", href: "/client/dashboard" },
    { label: "Invoices", href: "/client/invoices" },
    { label: "Payments", href: "/client/payments" },
    { label: "Files", href: "/client/files" },
    { label: "Messages", href: "/client/messages" },
  ],
  admin: [{ label: "Freelancers", href: "/admin/freelancers" }],
};

/*
  Shared navbar + sidebar for every freelancer and client page.
  The signed-in user is loaded from the server (/api/auth/me),
  which reads the HTTP-only cookie.
*/
export default function PortalShell({
  role,
  children,
}: {
  role: Role;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [userName, setUserName] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/auth/me", { cache: "no-store" })
      .then(async (response) => {
        if (cancelled) return;

        if (response.status === 401) {
          router.replace("/login");
          return;
        }

        const data = await response.json();

        if (data?.user?.role && data.user.role !== role) {
          router.replace(homeFor(data.user.role));
          return;
        }

        setUserName(data?.user?.name || "");
      })
      .catch(() => {
        // Network problem: the page itself will show its own error state.
      });

    return () => {
      cancelled = true;
    };
  }, [role, router]);

  const handleLogout = async () => {
    setLoggingOut(true);

    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (error) {
      console.error("Logout error:", error);
    }

    try {
      localStorage.removeItem("user");
    } catch {
      // localStorage is only a UI convenience; ignore if unavailable.
    }

    router.replace("/login");
    router.refresh();
  };

  const links = NAVIGATION[role];

  const isActive = (href: string) =>
    pathname === href ||
    pathname.startsWith(`${href}/`) ||
    (role === "client" &&
      href === "/client/dashboard" &&
      pathname.startsWith("/client/workspace"));

  return (
    <div className="min-h-screen bg-[#0b0f19] text-white">
      {/* NAVBAR */}
      <header className="fixed left-0 right-0 top-0 z-50 border-b border-white/10 bg-[#0b0f19]/95 backdrop-blur">
        <div className="flex h-16 items-center justify-between gap-4 px-4 md:px-6">
          <Link
            href={homeFor(role)}
            className="text-xl font-bold text-white"
          >
            Freelancer<span className="text-blue-500">Portal</span>
          </Link>

          <div className="flex items-center gap-3 md:gap-5">
            {userName && (
              <div className="hidden text-right sm:block">
                <p className="text-sm text-gray-200">{userName}</p>
                <p className="text-xs capitalize text-gray-500">
                  {role === "admin" ? "Administrator" : role}
                </p>
              </div>
            )}

            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="rounded-lg border border-red-500/30 px-4 py-2 text-sm text-red-400 transition hover:bg-red-500/10 disabled:opacity-50"
            >
              {loggingOut ? "Logging out..." : "Logout"}
            </button>
          </div>
        </div>

        {/* MOBILE NAVIGATION */}
        <nav className="flex gap-2 overflow-x-auto border-t border-white/10 px-4 py-2 md:hidden">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm ${
                isActive(link.href)
                  ? "bg-blue-600 font-medium text-white"
                  : "text-gray-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </header>

      {/* SIDEBAR */}
      <aside className="fixed bottom-0 left-0 top-16 hidden w-64 overflow-y-auto border-r border-white/10 bg-[#0f1420] md:block">
        <nav className="space-y-2 p-4">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`block rounded-lg px-4 py-3 text-sm transition ${
                isActive(link.href)
                  ? "bg-blue-600 font-medium text-white"
                  : "text-gray-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* PAGE CONTENT */}
      <main className="min-w-0 pt-[7.25rem] md:ml-64 md:pt-16">{children}</main>
    </div>
  );
}
