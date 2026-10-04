"use client";

import { useState } from "react";

import { useApiList } from "@/components/useApiList";
import {
  EmptyState,
  ErrorBanner,
  LoadingState,
  PageHeader,
  formatDate,
  formatFileSize,
  inputClass,
} from "@/components/ui";

type PortalFile = {
  _id: string;
  originalName: string;
  fileSize: number;
  fileType: string;
  createdAt: string;
  downloadUrl: string;
  project?: { name: string };
  freelancer?: { _id: string; name: string };
};

const extensionOf = (name: string) => {
  const parts = name.split(".");
  return parts.length > 1 ? parts.pop()!.toUpperCase().slice(0, 5) : "FILE";
};

export default function ClientFilesPage() {
  const { items: files, loading, error, reload } = useApiList<PortalFile>(
    "/api/files",
    "files"
  );

  const [search, setSearch] = useState("");
  const [freelancer, setFreelancer] = useState("All");

  const freelancers = [
    ...new Map(
      files
        .filter((file) => file.freelancer)
        .map((file) => [file.freelancer!._id, file.freelancer!.name])
    ),
  ];

  const visible = files.filter(
    (file) =>
      (freelancer === "All" || file.freelancer?._id === freelancer) &&
      `${file.originalName} ${file.project?.name} ${file.freelancer?.name}`
        .toLowerCase()
        .includes(search.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8">
      <PageHeader
        title="My Files"
        subtitle="Files shared with you by your freelancers."
      />

      <ErrorBanner message={error} onRetry={reload} />

      <div className="mb-6 flex flex-col gap-4 md:flex-row">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search file, project or freelancer..."
          className={`${inputClass} flex-1`}
        />
        <select
          value={freelancer}
          onChange={(event) => setFreelancer(event.target.value)}
          className={`${inputClass} md:w-56`}
        >
          <option value="All">All Freelancers</option>
          {freelancers.map(([id, name]) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <LoadingState label="Loading files..." />
      ) : visible.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-[#111827]">
          <EmptyState
            message={
              files.length === 0
                ? "No files have been shared with you yet."
                : "No files match your search."
            }
          />
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((file) => (
            <div
              key={file._id}
              className="rounded-2xl border border-white/10 bg-[#111827] p-5"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-xs font-bold text-blue-400">
                  {extensionOf(file.originalName)}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-medium" title={file.originalName}>
                    {file.originalName}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {formatFileSize(file.fileSize)} · {formatDate(file.createdAt)}
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-gray-500">Freelancer</span>
                  <span className="truncate text-gray-300">
                    {file.freelancer?.name || "-"}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-gray-500">Project</span>
                  <span className="truncate text-gray-300">
                    {file.project?.name || "-"}
                  </span>
                </div>
              </div>

              <a
                href={file.downloadUrl}
                className="mt-5 block rounded-lg bg-white/5 px-4 py-2.5 text-center text-sm font-medium text-blue-400 transition hover:bg-white/10"
              >
                Download
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
