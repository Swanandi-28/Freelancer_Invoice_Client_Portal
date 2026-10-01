"use client";

import { useState } from "react";
import Link from "next/link";

const initialFiles = [
  {
    id: 1,
    name: "project-requirements.pdf",
    freelancer: "Rahul Sharma",
    project: "E-commerce Website",
    type: "PDF",
    size: "1.2 MB",
    date: "20 Sep 2026",
  },
  {
    id: 2,
    name: "homepage-design.fig",
    freelancer: "Rahul Sharma",
    project: "E-commerce Website",
    type: "Design",
    size: "4.8 MB",
    date: "22 Sep 2026",
  },
  {
    id: 3,
    name: "brand-logo.zip",
    freelancer: "Priya Mehta",
    project: "Brand Identity Design",
    type: "Archive",
    size: "8.5 MB",
    date: "24 Sep 2026",
  },
  {
    id: 4,
    name: "mobile-wireframes.pdf",
    freelancer: "Priya Mehta",
    project: "Brand Identity Design",
    type: "PDF",
    size: "2.4 MB",
    date: "26 Sep 2026",
  },
];

export default function ClientFilesPage() {
  const [files, setFiles] = useState(initialFiles);
  const [search, setSearch] = useState("");

  const filteredFiles = files.filter(
    (file) =>
      file.name.toLowerCase().includes(search.toLowerCase()) ||
      file.freelancer.toLowerCase().includes(search.toLowerCase()) ||
      file.project.toLowerCase().includes(search.toLowerCase())
  );

  const deleteFile = (id: number) => {
    setFiles((currentFiles) =>
      currentFiles.filter((file) => file.id !== id)
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
          <h1 className="text-3xl font-bold">Shared Files</h1>

          <p className="text-slate-400 mt-2">
            Access files shared with you by your freelancers.
          </p>
        </div>

        {/* Search */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-8">
          <input
            type="text"
            placeholder="Search files, freelancers or projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-slate-950 border border-slate-700 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* File Grid */}
        {filteredFiles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredFiles.map((file) => (
              <div
                key={file.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold">
                      {file.type === "PDF"
                        ? "PDF"
                        : file.type === "Design"
                        ? "FIG"
                        : "ZIP"}
                    </div>

                    <div>
                      <h2 className="font-semibold">
                        {file.name}
                      </h2>

                      <p className="text-sm text-slate-500 mt-1">
                        {file.size} • {file.type}
                      </p>
                    </div>
                  </div>

                  <span className="text-xs text-slate-500">
                    {file.date}
                  </span>
                </div>

                <div className="border-t border-slate-800 mt-6 pt-5">
                  <p className="text-sm text-slate-400">
                    Freelancer
                  </p>

                  <p className="font-medium mt-1">
                    {file.freelancer}
                  </p>

                  <p className="text-sm text-slate-400 mt-4">
                    Project
                  </p>

                  <p className="font-medium mt-1">
                    {file.project}
                  </p>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    className="flex-1 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 font-medium"
                  >
                    Download
                  </button>

                  <button
                    onClick={() => deleteFile(file.id)}
                    className="px-4 py-2.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
            <h2 className="text-xl font-semibold">
              No files found
            </h2>

            <p className="text-slate-400 mt-2">
              Try changing your search.
            </p>
          </div>
        )}

        {/* Information */}
        <div className="mt-8 bg-blue-500/10 border border-blue-500/20 rounded-xl p-5">
          <p className="text-blue-300 text-sm">
            <span className="font-semibold">File Sharing:</span>{" "}
            These are currently sample file records. Actual file
            uploads and downloads will be connected to cloud or
            server storage later.
          </p>
        </div>
      </div>
    </main>
  );
}