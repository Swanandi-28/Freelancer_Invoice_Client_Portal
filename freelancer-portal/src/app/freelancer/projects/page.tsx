"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Client {
  _id: string;
  name: string;
  company: string;
  email: string;
}

interface Project {
  _id: string;
  name: string;
  description: string;
  budget: number;
  // From the server: completed payments of this project, and
  // pendingAmount = budget - paidAmount
  paidAmount?: number;
  pendingAmount?: number;
  deadline: string;
  status: string;
  client: Client;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);

  const [showForm, setShowForm] = useState(false);

  const [name, setName] = useState("");
  const [clientId, setClientId] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");
  const [deadline, setDeadline] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [search, setSearch] = useState("");
  const [pageLoading, setPageLoading] = useState(true);

  const loadData = async () => {
    try {
      // The server identifies the freelancer from the auth cookie.
      const [clientsResponse, projectsResponse] =
        await Promise.all([
          fetch("/api/clients", { cache: "no-store" }),
          fetch("/api/projects", { cache: "no-store" }),
        ]);

      const clientsData = await clientsResponse.json();
      const projectsData = await projectsResponse.json();

      if (clientsData.success) {
        setClients(clientsData.clients);
      }

      if (projectsData.success) {
        setProjects(projectsData.projects);
      }

      if (!clientsResponse.ok || !projectsResponse.ok) {
        setMessage(
          clientsData.message ||
            projectsData.message ||
            "Failed to load projects."
        );
      }
    } catch (error) {
      console.error("Failed to load data:", error);
      setMessage("Unable to load projects from the server.");
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateProject = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    setMessage("");

    try {
      setLoading(true);

      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clientId,
          name,
          description,
          budget,
          deadline,
          status: "In Progress",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Failed to create project.");
        return;
      }

      setMessage("Project created successfully.");

      setName("");
      setClientId("");
      setDescription("");
      setBudget("");
      setDeadline("");
      setShowForm(false);

      await loadData();
    } catch (error) {
      console.error(error);
      setMessage("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter((project) => {
    const text = search.toLowerCase();

    return (
      project.name.toLowerCase().includes(text) ||
      project.client?.name?.toLowerCase().includes(text) ||
      project.client?.company?.toLowerCase().includes(text)
    );
  });

  return (
    <div>

      {/* Navbar */}

      <div className="flex">

        {/* Sidebar */}

        {/* Main */}
        <section className="flex-1 min-w-0 p-4 md:p-8">

          {/* Heading */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">

            <div>
              <h1 className="text-3xl font-bold">
                Projects
              </h1>

              <p className="text-slate-400 mt-1">
                Manage your projects and deadlines
              </p>
            </div>

            <button
              onClick={() => setShowForm(!showForm)}
              className="px-5 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 font-semibold"
            >
              + New Project
            </button>

          </div>

          {/* Message */}
          {message && (
            <div className="mb-6 p-4 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-300">
              {message}
            </div>
          )}

          {/* Form */}
          {showForm && (
            <form
              onSubmit={handleCreateProject}
              className="mb-8 bg-[#111827] border border-white/10 rounded-xl p-6"
            >

              <h2 className="text-xl font-semibold mb-5">
                Create New Project
              </h2>

              <div className="grid md:grid-cols-2 gap-4">

                <input
                  type="text"
                  placeholder="Project Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="px-4 py-3 rounded-lg bg-[#0b0f19] border border-white/10 outline-none focus:border-blue-500"
                />

                <select
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  required
                  className="px-4 py-3 rounded-lg bg-[#0b0f19] border border-white/10 outline-none focus:border-blue-500"
                >
                  <option value="">Select Client</option>

                  {clients.map((client) => (
                    <option
                      key={client._id}
                      value={client._id}
                    >
                      {client.name} - {client.company}
                    </option>
                  ))}
                </select>

                <textarea
                  placeholder="Project Description"
                  value={description}
                  onChange={(e) =>
                    setDescription(e.target.value)
                  }
                  className="md:col-span-2 px-4 py-3 rounded-lg bg-[#0b0f19] border border-white/10 outline-none focus:border-blue-500"
                  rows={3}
                />

                <input
                  type="number"
                  placeholder="Budget"
                  value={budget}
                  onChange={(e) =>
                    setBudget(e.target.value)
                  }
                  required
                  min="0"
                  className="px-4 py-3 rounded-lg bg-[#0b0f19] border border-white/10 outline-none focus:border-blue-500"
                />

                <input
                  type="date"
                  value={deadline}
                  onChange={(e) =>
                    setDeadline(e.target.value)
                  }
                  required
                  className="px-4 py-3 rounded-lg bg-[#0b0f19] border border-white/10 outline-none focus:border-blue-500"
                />

              </div>

              <div className="flex gap-3 mt-5">

                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 font-semibold"
                >
                  {loading
                    ? "Creating..."
                    : "Create Project"}
                </button>

                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-5 py-2.5 rounded-lg bg-white/10 hover:bg-white/20"
                >
                  Cancel
                </button>

              </div>

            </form>
          )}

          {/* Search */}
          <div className="mb-6">

            <input
              type="text"
              placeholder="Search projects..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              className="w-full max-w-md px-4 py-3 rounded-lg bg-[#111827] border border-white/10 outline-none focus:border-blue-500"
            />

          </div>

          {/* Project Cards */}
          {filteredProjects.length === 0 ? (

            <div className="bg-[#111827] border border-white/10 rounded-xl p-12 text-center text-slate-400">
              {pageLoading
                ? "Loading projects..."
                : projects.length === 0
                  ? clients.length === 0
                    ? "No projects found. Add a client first, then create a project."
                    : "No projects found. Create your first project."
                  : "No projects match your search."}
            </div>

          ) : (

            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">

              {filteredProjects.map((project) => (

                <div
                  key={project._id}
                  className="bg-[#111827] border border-white/10 rounded-xl p-6 hover:border-white/20 transition"
                >

                  <div className="flex items-start justify-between gap-4">

                    <div>
                      <h2 className="text-lg font-semibold">
                        {project.name}
                      </h2>

                      <p className="text-sm text-slate-400 mt-1">
                        {project.client?.company}
                      </p>
                    </div>

                    <span className="px-3 py-1 rounded-full text-xs bg-blue-500/10 text-blue-400 whitespace-nowrap">
                      {project.status}
                    </span>

                  </div>

                  <p className="text-sm text-slate-400 mt-5 min-h-10">
                    {project.description ||
                      "No description provided."}
                  </p>

                  <div className="mt-6 space-y-3">

                    <div className="flex justify-between">
                      <span className="text-slate-400">
                        Budget
                      </span>

                      <span className="font-semibold">
                        ₹{project.budget.toLocaleString("en-IN")}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-400">
                        Paid
                      </span>

                      <span className="text-green-400">
                        ₹{(project.paidAmount ?? 0).toLocaleString("en-IN")}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-400">
                        Pending
                      </span>

                      <span className="text-yellow-400">
                        ₹{(project.pendingAmount ?? project.budget).toLocaleString("en-IN")}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-400">
                        Deadline
                      </span>

                      <span>
                        {new Date(
                          project.deadline
                        ).toLocaleDateString("en-IN")}
                      </span>
                    </div>

                  </div>

                </div>

              ))}

            </div>

          )}

        </section>

      </div>

    </div>
  );
}