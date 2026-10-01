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

  const getUser = () => {
    if (typeof window === "undefined") return null;

    const user = localStorage.getItem("user");

    if (!user) return null;

    try {
      return JSON.parse(user);
    } catch {
      return null;
    }
  };

  const loadData = async () => {
    const user = getUser();

    if (!user?.id) return;

    try {
      const [clientsResponse, projectsResponse] =
        await Promise.all([
          fetch(`/api/clients?freelancerId=${user.id}`),
          fetch(`/api/projects?freelancerId=${user.id}`),
        ]);

      const clientsData = await clientsResponse.json();
      const projectsData = await projectsResponse.json();

      if (clientsData.success) {
        setClients(clientsData.clients);
      }

      if (projectsData.success) {
        setProjects(projectsData.projects);
      }
    } catch (error) {
      console.error("Failed to load data:", error);
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

    const user = getUser();

    if (!user?.id) {
      setMessage("Please login first.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          freelancerId: user.id,
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
    <main className="min-h-screen bg-slate-950 text-white">

      {/* Navbar */}
      <nav className="border-b border-slate-800 bg-slate-900">
        <div className="flex items-center justify-between px-6 py-4">

          <Link
            href="/freelancer/dashboard"
            className="text-xl font-bold text-blue-400"
          >
            FreelancerPortal
          </Link>

          <Link
            href="/freelancer/dashboard"
            className="text-sm text-slate-400 hover:text-white"
          >
            Dashboard
          </Link>

        </div>
      </nav>

      <div className="flex">

        {/* Sidebar */}
        <aside className="w-64 min-h-[calc(100vh-73px)] border-r border-slate-800 bg-slate-900 p-5">

          <div className="space-y-2">

            <Link
              href="/freelancer/dashboard"
              className="block px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800"
            >
              Dashboard
            </Link>

            <Link
              href="/freelancer/clients"
              className="block px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800"
            >
              Clients
            </Link>

            <Link
              href="/freelancer/projects"
              className="block px-4 py-3 rounded-lg bg-blue-600"
            >
              Projects
            </Link>

            <Link
              href="/freelancer/invoices"
              className="block px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800"
            >
              Invoices
            </Link>

            <Link
              href="/freelancer/payments"
              className="block px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800"
            >
              Payments
            </Link>

            <Link
              href="/freelancer/files"
              className="block px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800"
            >
              Files
            </Link>

            <Link
              href="/freelancer/messages"
              className="block px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800"
            >
              Messages
            </Link>

            <Link
              href="/freelancer/reports"
              className="block px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800"
            >
              Reports
            </Link>

          </div>
        </aside>

        {/* Main */}
        <section className="flex-1 p-8">

          {/* Heading */}
          <div className="flex items-center justify-between mb-8">

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
              className="mb-8 bg-slate-900 border border-slate-800 rounded-xl p-6"
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
                  className="px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 outline-none focus:border-blue-500"
                />

                <select
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  required
                  className="px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 outline-none focus:border-blue-500"
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
                  className="md:col-span-2 px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 outline-none focus:border-blue-500"
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
                  className="px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 outline-none focus:border-blue-500"
                />

                <input
                  type="date"
                  value={deadline}
                  onChange={(e) =>
                    setDeadline(e.target.value)
                  }
                  required
                  className="px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 outline-none focus:border-blue-500"
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
                  className="px-5 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700"
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
              className="w-full max-w-md px-4 py-3 rounded-lg bg-slate-900 border border-slate-800 outline-none focus:border-blue-500"
            />

          </div>

          {/* Project Cards */}
          {filteredProjects.length === 0 ? (

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-400">
              No projects found. Create your first project.
            </div>

          ) : (

            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">

              {filteredProjects.map((project) => (

                <div
                  key={project._id}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition"
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
                        ₹{project.budget.toLocaleString()}
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

    </main>
  );
}