"use client";

import { useState } from "react";
import Link from "next/link";

type FileItem = {
  id: number;
  name: string;
  client: string;
  project: string;
  size: string;
  type: string;
  uploadedDate: string;
};

export default function FilesPage() {
  const [showForm, setShowForm] = useState(false);

  const [files, setFiles] = useState<FileItem[]>([
    {
      id: 1,
      name: "homepage-design.fig",
      client: "ABC Company",
      project: "E-commerce Website",
      size: "4.8 MB",
      type: "Design",
      uploadedDate: "20 Sep 2026",
    },
    {
      id: 2,
      name: "project-requirements.pdf",
      client: "ABC Company",
      project: "E-commerce Website",
      size: "1.2 MB",
      type: "PDF",
      uploadedDate: "18 Sep 2026",
    },
    {
      id: 3,
      name: "brand-logo.zip",
      client: "XYZ Solutions",
      project: "Brand Identity Design",
      size: "8.5 MB",
      type: "Archive",
      uploadedDate: "15 Sep 2026",
    },
    {
      id: 4,
      name: "mobile-wireframes.pdf",
      client: "Tech Startup",
      project: "Mobile App UI",
      size: "2.4 MB",
      type: "PDF",
      uploadedDate: "12 Sep 2026",
    },
  ]);

  const [newFile, setNewFile] = useState({
    name: "",
    client: "",
    project: "",
    size: "",
    type: "PDF",
  });

  function handleAddFile(e: React.FormEvent) {
    e.preventDefault();

    if (
      !newFile.name ||
      !newFile.client ||
      !newFile.project ||
      !newFile.size
    ) {
      return;
    }

    const file: FileItem = {
      id: Date.now(),
      name: newFile.name,
      client: newFile.client,
      project: newFile.project,
      size: `${newFile.size} MB`,
      type: newFile.type,
      uploadedDate: new Date().toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    };

    setFiles([...files, file]);

    setNewFile({
      name: "",
      client: "",
      project: "",
      size: "",
      type: "PDF",
    });

    setShowForm(false);
  }

  function handleDeleteFile(id: number) {
    setFiles(files.filter((file) => file.id !== id));
  }

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
              active
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
                Files
              </h1>

              <p className="text-slate-400 mt-2">
                Manage project files and documents shared with clients.
              </p>
            </div>

            <button
              onClick={() => setShowForm(!showForm)}
              className="px-5 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 font-medium"
            >
              + Add File
            </button>
          </div>

          {/* File Form */}
          {showForm && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-8">
              <h2 className="text-xl font-semibold mb-6">
                Add File
              </h2>

              <form
                onSubmit={handleAddFile}
                className="grid grid-cols-1 md:grid-cols-2 gap-5"
              >
                {/* File Name */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    File Name
                  </label>

                  <input
                    type="text"
                    value={newFile.name}
                    onChange={(e) =>
                      setNewFile({
                        ...newFile,
                        name: e.target.value,
                      })
                    }
                    placeholder="project-design.pdf"
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
                    value={newFile.client}
                    onChange={(e) =>
                      setNewFile({
                        ...newFile,
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
                    value={newFile.project}
                    onChange={(e) =>
                      setNewFile({
                        ...newFile,
                        project: e.target.value,
                      })
                    }
                    placeholder="Project name"
                    className="w-full px-4 py-3 rounded-lg bg-slate-950 border border-slate-700 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* File Size */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    File Size
                  </label>

                  <input
                    type="number"
                    step="0.1"
                    value={newFile.size}
                    onChange={(e) =>
                      setNewFile({
                        ...newFile,
                        size: e.target.value,
                      })
                    }
                    placeholder="2.5"
                    className="w-full px-4 py-3 rounded-lg bg-slate-950 border border-slate-700 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* File Type */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    File Type
                  </label>

                  <select
                    value={newFile.type}
                    onChange={(e) =>
                      setNewFile({
                        ...newFile,
                        type: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 rounded-lg bg-slate-950 border border-slate-700 focus:outline-none focus:border-blue-500"
                  >
                    <option>PDF</option>
                    <option>Document</option>
                    <option>Image</option>
                    <option>Design</option>
                    <option>Archive</option>
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
                    Add File
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Search */}
          <div className="mb-6">
            <input
              type="text"
              placeholder="Search files..."
              className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-slate-800 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Files Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {files.map((file) => (
              <div
                key={file.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-blue-500/50 transition"
              >
                {/* File Icon */}
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center text-2xl">
                    {getFileIcon(file.type)}
                  </div>

                  <span className="text-xs px-3 py-1 rounded-full bg-slate-800 text-slate-300">
                    {file.type}
                  </span>
                </div>

                {/* File Information */}
                <h2 className="font-semibold mt-5 truncate">
                  {file.name}
                </h2>

                <p className="text-sm text-blue-400 mt-1">
                  {file.client}
                </p>

                <p className="text-sm text-slate-400 mt-3">
                  {file.project}
                </p>

                <div className="border-t border-slate-800 mt-5 pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">
                      Size
                    </span>

                    <span className="text-slate-300">
                      {file.size}
                    </span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">
                      Uploaded
                    </span>

                    <span className="text-slate-300">
                      {file.uploadedDate}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 mt-6">
                  <button className="flex-1 py-2 rounded-lg border border-slate-700 hover:bg-slate-800 text-sm">
                    View
                  </button>

                  <button className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm">
                    Download
                  </button>

                  <button
                    onClick={() => handleDeleteFile(file.id)}
                    className="px-3 py-2 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 text-sm text-slate-500">
            Showing {files.length} files
          </div>
        </section>
      </div>
    </main>
  );
}

function getFileIcon(type: string) {
  switch (type) {
    case "PDF":
      return "📄";

    case "Document":
      return "📝";

    case "Image":
      return "🖼️";

    case "Design":
      return "🎨";

    case "Archive":
      return "📦";

    default:
      return "📎";
  }
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