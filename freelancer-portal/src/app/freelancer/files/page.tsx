"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Client = {
  _id: string;
  name: string;
  company: string;
  email: string;
};

type Project = {
  _id: string;
  name: string;
  client:
    | string
    | {
        _id: string;
        name: string;
        company: string;
      };
};

type UploadedFile = {
  _id: string;
  fileName: string;
  originalName: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
  createdAt: string;

  client:
    | string
    | {
        _id: string;
        name: string;
        company: string;
      };

  project:
    | string
    | {
        _id: string;
        name: string;
      };
};

export default function FreelancerFilesPage() {
  const router = useRouter();

  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [files, setFiles] = useState<UploadedFile[]>([]);

  const [selectedClient, setSelectedClient] = useState("");
  const [selectedProject, setSelectedProject] = useState("");

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [search, setSearch] = useState("");

  const [showForm, setShowForm] = useState(false);

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // =====================================================
  // LOAD DATA
  // =====================================================

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const [clientsResponse, projectsResponse, filesResponse] =
        await Promise.all([
          fetch("/api/clients", {
            cache: "no-store",
          }),

          fetch("/api/projects", {
            cache: "no-store",
          }),

          fetch("/api/files", {
            cache: "no-store",
          }),
        ]);

      const clientsData = await clientsResponse.json();
      const projectsData = await projectsResponse.json();
      const filesData = await filesResponse.json();

      if (
        clientsResponse.status === 401 ||
        projectsResponse.status === 401 ||
        filesResponse.status === 401
      ) {
        router.push("/login");
        return;
      }

      if (!clientsResponse.ok) {
        throw new Error(
          clientsData.message || "Failed to load clients."
        );
      }

      if (!projectsResponse.ok) {
        throw new Error(
          projectsData.message || "Failed to load projects."
        );
      }

      if (!filesResponse.ok) {
        throw new Error(
          filesData.message || "Failed to load files."
        );
      }

      setClients(clientsData.clients || []);
      setProjects(projectsData.projects || []);
      setFiles(filesData.files || []);
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load files."
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // PROJECTS FOR SELECTED CLIENT
  // =====================================================

  const availableProjects = useMemo(() => {
    if (!selectedClient) {
      return projects;
    }

    return projects.filter((project) => {
      const clientId =
        typeof project.client === "string"
          ? project.client
          : project.client?._id;

      return clientId === selectedClient;
    });
  }, [projects, selectedClient]);

  // =====================================================
  // CLIENT CHANGE
  // =====================================================

  const handleClientChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setSelectedClient(event.target.value);
    setSelectedProject("");
  };

  // =====================================================
  // FILE SELECT
  // =====================================================

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0] || null;

    setSelectedFile(file);
    setError("");
  };

  // =====================================================
  // UPLOAD
  // =====================================================

  const handleUpload = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!selectedClient) {
      setError("Please select a client.");
      return;
    }

    if (!selectedProject) {
      setError("Please select a project.");
      return;
    }

    if (!selectedFile) {
      setError("Please select a file.");
      return;
    }

    try {
      setUploading(true);

      const formData = new FormData();

      formData.append("file", selectedFile);
      formData.append("clientId", selectedClient);
      formData.append("projectId", selectedProject);

      const response = await fetch("/api/files", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.status === 401) {
        router.push("/login");
        return;
      }

      if (!response.ok) {
        setError(
          data.message || "Failed to upload file."
        );
        return;
      }

      setSuccess("File uploaded successfully.");

      setSelectedClient("");
      setSelectedProject("");
      setSelectedFile(null);

      const fileInput = document.getElementById(
        "file-upload"
      ) as HTMLInputElement | null;

      if (fileInput) {
        fileInput.value = "";
      }

      setShowForm(false);

      await fetchData();
    } catch (error) {
      console.error(error);

      setError("Unable to connect to the server.");
    } finally {
      setUploading(false);
    }
  };

  // =====================================================
  // HELPERS
  // =====================================================

  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes === 0) {
      return "0 Bytes";
    }

    const units = [
      "Bytes",
      "KB",
      "MB",
      "GB",
    ];

    const index = Math.floor(
      Math.log(bytes) / Math.log(1024)
    );

    return `${(
      bytes / Math.pow(1024, index)
    ).toFixed(index === 0 ? 0 : 2)} ${units[index]}`;
  };

  const formatDate = (date: string) => {
    if (!date) {
      return "-";
    }

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getClientName = (
    client: UploadedFile["client"]
  ) => {
    if (typeof client === "string") {
      const found = clients.find(
        (item) => item._id === client
      );

      return found?.company || found?.name || "Unknown";
    }

    return (
      client?.company ||
      client?.name ||
      "Unknown"
    );
  };

  const getProjectName = (
    project: UploadedFile["project"]
  ) => {
    if (typeof project === "string") {
      const found = projects.find(
        (item) => item._id === project
      );

      return found?.name || "Unknown";
    }

    return project?.name || "Unknown";
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes("pdf")) {
      return "📄";
    }

    if (
      fileType.includes("image") ||
      fileType.includes("png") ||
      fileType.includes("jpeg")
    ) {
      return "🖼️";
    }

    if (
      fileType.includes("word") ||
      fileType.includes("document")
    ) {
      return "📝";
    }

    if (
      fileType.includes("spreadsheet") ||
      fileType.includes("excel")
    ) {
      return "📊";
    }

    if (
      fileType.includes("zip") ||
      fileType.includes("rar")
    ) {
      return "📦";
    }

    return "📁";
  };

  // =====================================================
  // FILTER FILES
  // =====================================================

  const filteredFiles = files.filter((file) => {
    const searchText = search.toLowerCase();

    return (
      file.originalName
        .toLowerCase()
        .includes(searchText) ||
      getClientName(file.client)
        .toLowerCase()
        .includes(searchText) ||
      getProjectName(file.project)
        .toLowerCase()
        .includes(searchText)
    );
  });

  // =====================================================
  // LOGOUT
  // =====================================================

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
    } catch (error) {
      console.error(error);
    }

    localStorage.removeItem("user");

    router.push("/login");
  };

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <div className="min-h-screen bg-[#0b0f19] text-white">

      {/* NAVBAR */}

      <header className="fixed left-0 right-0 top-0 z-50 border-b border-white/10 bg-[#0b0f19]/95 backdrop-blur">

        <div className="flex h-16 items-center justify-between px-6">

          <Link
            href="/freelancer/dashboard"
            className="text-xl font-bold"
          >
            Freelancer<span className="text-blue-500">
              Portal
            </span>
          </Link>

          <div className="flex items-center gap-5">

            <span className="text-sm text-gray-300">
              Freelancer
            </span>

            <button
              onClick={handleLogout}
              className="rounded-lg border border-red-500/30 px-4 py-2 text-sm text-red-400 transition hover:bg-red-500/10"
            >
              Logout
            </button>

          </div>

        </div>

      </header>

      {/* SIDEBAR */}

      <aside className="fixed bottom-0 left-0 top-16 hidden w-64 border-r border-white/10 bg-[#0f1420] md:block">

        <nav className="space-y-2 p-4">

          <Link
            href="/freelancer/dashboard"
            className="block rounded-lg px-4 py-3 text-sm text-gray-400 transition hover:bg-white/5 hover:text-white"
          >
            Dashboard
          </Link>

          <Link
            href="/freelancer/clients"
            className="block rounded-lg px-4 py-3 text-sm text-gray-400 transition hover:bg-white/5 hover:text-white"
          >
            Clients
          </Link>

          <Link
            href="/freelancer/projects"
            className="block rounded-lg px-4 py-3 text-sm text-gray-400 transition hover:bg-white/5 hover:text-white"
          >
            Projects
          </Link>

          <Link
            href="/freelancer/invoices"
            className="block rounded-lg px-4 py-3 text-sm text-gray-400 transition hover:bg-white/5 hover:text-white"
          >
            Invoices
          </Link>

          <Link
            href="/freelancer/payments"
            className="block rounded-lg px-4 py-3 text-sm text-gray-400 transition hover:bg-white/5 hover:text-white"
          >
            Payments
          </Link>

          <Link
            href="/freelancer/files"
            className="block rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium"
          >
            Files
          </Link>

          <Link
            href="/freelancer/messages"
            className="block rounded-lg px-4 py-3 text-sm text-gray-400 transition hover:bg-white/5 hover:text-white"
          >
            Messages
          </Link>

          <Link
            href="/freelancer/reports"
            className="block rounded-lg px-4 py-3 text-sm text-gray-400 transition hover:bg-white/5 hover:text-white"
          >
            Reports
          </Link>

        </nav>

      </aside>

      {/* MAIN */}

      <main className="pt-16 md:ml-64">

        <div className="p-6 md:p-8">

          {/* HEADER */}

          <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">

            <div>

              <h1 className="text-3xl font-bold">
                Files
              </h1>

              <p className="mt-2 text-gray-400">
                Manage project files and documents.
              </p>

            </div>

            <button
              onClick={() => {
                setShowForm(!showForm);
                setError("");
                setSuccess("");
              }}
              className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-medium transition hover:bg-blue-500"
            >
              {showForm
                ? "Close Form"
                : "+ Upload File"}
            </button>

          </div>

          {/* SUCCESS */}

          {success && (
            <div className="mb-6 rounded-lg border border-green-500/20 bg-green-500/10 p-4 text-green-400">
              {success}
            </div>
          )}

          {/* ERROR */}

          {error && (
            <div className="mb-6 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-red-400">
              {error}
            </div>
          )}

          {/* UPLOAD FORM */}

          {showForm && (

            <div className="mb-8 rounded-xl border border-white/10 bg-[#111827] p-6">

              <div className="mb-6">

                <h2 className="text-xl font-semibold">
                  Upload File
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Attach a file to a specific client and
                  project.
                </p>

              </div>

              <form
                onSubmit={handleUpload}
                className="grid gap-5 md:grid-cols-2"
              >

                {/* CLIENT */}

                <div>

                  <label className="mb-2 block text-sm text-gray-400">
                    Client
                  </label>

                  <select
                    value={selectedClient}
                    onChange={handleClientChange}
                    className="w-full rounded-lg border border-white/10 bg-[#0b0f19] px-4 py-3 text-white outline-none focus:border-blue-500"
                  >

                    <option value="">
                      Select Client
                    </option>

                    {clients.map((client) => (

                      <option
                        key={client._id}
                        value={client._id}
                      >
                        {client.company} — {client.name}
                      </option>

                    ))}

                  </select>

                </div>

                {/* PROJECT */}

                <div>

                  <label className="mb-2 block text-sm text-gray-400">
                    Project
                  </label>

                  <select
                    value={selectedProject}
                    onChange={(event) =>
                      setSelectedProject(
                        event.target.value
                      )
                    }
                    disabled={!selectedClient}
                    className="w-full rounded-lg border border-white/10 bg-[#0b0f19] px-4 py-3 text-white outline-none disabled:cursor-not-allowed disabled:opacity-50 focus:border-blue-500"
                  >

                    <option value="">
                      {selectedClient
                        ? "Select Project"
                        : "Select a client first"}
                    </option>

                    {availableProjects.map(
                      (project) => (

                        <option
                          key={project._id}
                          value={project._id}
                        >
                          {project.name}
                        </option>

                      )
                    )}

                  </select>

                </div>

                {/* FILE */}

                <div className="md:col-span-2">

                  <label className="mb-2 block text-sm text-gray-400">
                    File
                  </label>

                  <input
                    id="file-upload"
                    type="file"
                    onChange={handleFileChange}
                    className="w-full cursor-pointer rounded-lg border border-white/10 bg-[#0b0f19] px-4 py-3 text-sm text-gray-300 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-blue-500"
                  />

                  {selectedFile && (

                    <div className="mt-3 rounded-lg bg-white/5 p-3 text-sm">

                      <p className="font-medium">
                        {selectedFile.name}
                      </p>

                      <p className="mt-1 text-gray-500">
                        {formatFileSize(
                          selectedFile.size
                        )}
                      </p>

                    </div>

                  )}

                </div>

                {/* BUTTONS */}

                <div className="flex gap-3 md:col-span-2">

                  <button
                    type="submit"
                    disabled={uploading}
                    className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {uploading
                      ? "Uploading..."
                      : "Upload File"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setError("");
                    }}
                    className="rounded-lg border border-white/10 px-6 py-3 text-sm text-gray-300 transition hover:bg-white/5"
                  >
                    Cancel
                  </button>

                </div>

              </form>

            </div>

          )}

          {/* SEARCH */}

          <div className="mb-6 flex flex-col gap-4 md:flex-row">

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search files, clients or projects..."
              className="flex-1 rounded-lg border border-white/10 bg-[#111827] px-4 py-3 text-white outline-none placeholder:text-gray-600 focus:border-blue-500"
            />

            <button
              onClick={fetchData}
              className="rounded-lg border border-white/10 bg-[#111827] px-5 py-3 text-sm text-gray-300 transition hover:bg-white/5"
            >
              ↻ Refresh
            </button>

          </div>

          {/* FILE COUNT */}

          <div className="mb-5">

            <p className="text-sm text-gray-500">

              {loading
                ? "Loading files..."
                : `${filteredFiles.length} file${
                    filteredFiles.length !== 1
                      ? "s"
                      : ""
                  }`}

            </p>

          </div>

          {/* FILES */}

          {loading ? (

            <div className="rounded-xl border border-white/10 bg-[#111827] p-10 text-center text-gray-500">
              Loading files...
            </div>

          ) : filteredFiles.length === 0 ? (

            <div className="rounded-xl border border-white/10 bg-[#111827] p-12 text-center">

              <div className="text-5xl">
                📁
              </div>

              <h2 className="mt-5 text-xl font-semibold">
                No files yet
              </h2>

              <p className="mt-2 text-gray-500">
                Upload your first project file to see it
                here.
              </p>

              <button
                onClick={() => setShowForm(true)}
                className="mt-6 rounded-lg bg-blue-600 px-5 py-3 text-sm font-medium hover:bg-blue-500"
              >
                + Upload File
              </button>

            </div>

          ) : (

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

              {filteredFiles.map((file) => (

                <div
                  key={file._id}
                  className="rounded-xl border border-white/10 bg-[#111827] p-5 transition hover:border-white/20"
                >

                  {/* FILE ICON */}

                  <div className="mb-5 flex items-start justify-between">

                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-2xl">
                      {getFileIcon(file.fileType)}
                    </div>

                    <span className="text-xs text-gray-500">
                      {formatFileSize(file.fileSize)}
                    </span>

                  </div>

                  {/* FILE NAME */}

                  <h3
                    className="truncate font-semibold"
                    title={file.originalName}
                  >
                    {file.originalName}
                  </h3>

                  {/* CLIENT */}

                  <p className="mt-3 text-sm text-gray-400">
                    Client:{" "}
                    <span className="text-gray-300">
                      {getClientName(file.client)}
                    </span>
                  </p>

                  {/* PROJECT */}

                  <p className="mt-1 text-sm text-gray-400">
                    Project:{" "}
                    <span className="text-gray-300">
                      {getProjectName(file.project)}
                    </span>
                  </p>

                  {/* DATE */}

                  <p className="mt-3 text-xs text-gray-600">
                    Uploaded{" "}
                    {formatDate(file.createdAt)}
                  </p>

                  {/* ACTION */}

                  <div className="mt-5 border-t border-white/10 pt-4">

                    <a
                      href={file.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full rounded-lg bg-white/5 px-4 py-2.5 text-center text-sm font-medium text-blue-400 transition hover:bg-white/10"
                    >
                      View / Download
                    </a>

                  </div>

                </div>

              ))}

            </div>

          )}

          {/* FOOTER */}

          <div className="mt-10 border-t border-white/10 py-6 text-center text-sm text-gray-600">
            FreelancerPortal © 2026 — Freelancer Invoice &
            Client Portal
          </div>

        </div>

      </main>

    </div>
  );
}