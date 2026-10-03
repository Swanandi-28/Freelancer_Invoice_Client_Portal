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

type Message = {
  _id: string;
  message: string;
  senderRole: "freelancer" | "client";
  senderId: string;
  read: boolean;
  createdAt: string;

  client:
    | string
    | {
        _id: string;
        name: string;
        company: string;
      };

  project?:
    | string
    | {
        _id: string;
        name: string;
      };
};

export default function FreelancerMessagesPage() {
  const router = useRouter();

  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);

  const [selectedClient, setSelectedClient] =
    useState<string>("");

  const [selectedProject, setSelectedProject] =
    useState<string>("");

  const [messageText, setMessageText] =
    useState("");

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // =====================================================
  // LOAD CLIENTS + PROJECTS + MESSAGES
  // =====================================================

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        clientsResponse,
        projectsResponse,
        messagesResponse,
      ] = await Promise.all([
        fetch("/api/clients", {
          cache: "no-store",
        }),

        fetch("/api/projects", {
          cache: "no-store",
        }),

        fetch("/api/messages", {
          cache: "no-store",
        }),
      ]);

      const clientsData = await clientsResponse.json();
      const projectsData = await projectsResponse.json();
      const messagesData = await messagesResponse.json();

      if (
        clientsResponse.status === 401 ||
        projectsResponse.status === 401 ||
        messagesResponse.status === 401
      ) {
        router.push("/login");
        return;
      }

      if (!clientsResponse.ok) {
        throw new Error(
          clientsData.message ||
            "Failed to load clients."
        );
      }

      if (!projectsResponse.ok) {
        throw new Error(
          projectsData.message ||
            "Failed to load projects."
        );
      }

      if (!messagesResponse.ok) {
        throw new Error(
          messagesData.message ||
            "Failed to load messages."
        );
      }

      const loadedClients =
        clientsData.clients || [];

      setClients(loadedClients);

      setProjects(
        projectsData.projects || []
      );

      setMessages(
        messagesData.messages || []
      );

      // Automatically select first client
      if (
        loadedClients.length > 0 &&
        !selectedClient
      ) {
        setSelectedClient(
          loadedClients[0]._id
        );
      }
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load messages."
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // GET CLIENT MESSAGES
  // =====================================================

  const loadClientMessages = async (
    clientId: string
  ) => {
    try {
      setError("");

      const response = await fetch(
        `/api/messages?clientId=${clientId}`,
        {
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        router.push("/login");
        return;
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to load conversation."
        );
      }

      setMessages(data.messages || []);
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load conversation."
      );
    }
  };

  // =====================================================
  // CLIENT CHANGE
  // =====================================================

  const handleClientSelect = (
    clientId: string
  ) => {
    setSelectedClient(clientId);

    setSelectedProject("");

    setMessageText("");

    loadClientMessages(clientId);
  };

  // =====================================================
  // PROJECTS FOR SELECTED CLIENT
  // =====================================================

  const availableProjects = useMemo(() => {
    if (!selectedClient) {
      return [];
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
  // SELECTED CLIENT
  // =====================================================

  const selectedClientData = clients.find(
    (client) =>
      client._id === selectedClient
  );

  // =====================================================
  // SEND MESSAGE
  // =====================================================

  const handleSendMessage = async () => {
    const trimmedMessage =
      messageText.trim();

    if (!selectedClient) {
      setError("Please select a client.");
      return;
    }

    if (!trimmedMessage) {
      return;
    }

    try {
      setSending(true);
      setError("");
      setSuccess("");

      const response = await fetch(
        "/api/messages",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            clientId: selectedClient,
            projectId:
              selectedProject || undefined,
            message: trimmedMessage,
          }),
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        router.push("/login");
        return;
      }

      if (!response.ok) {
        setError(
          data.message ||
            "Failed to send message."
        );
        return;
      }

      setMessageText("");

      setSuccess("Message sent.");

      // Reload conversation
      await loadClientMessages(
        selectedClient
      );

      // Remove success message after short delay
      setTimeout(() => {
        setSuccess("");
      }, 2000);
    } catch (error) {
      console.error(error);

      setError(
        "Unable to connect to the server."
      );
    } finally {
      setSending(false);
    }
  };

  // =====================================================
  // ENTER TO SEND
  // =====================================================

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLTextAreaElement>
  ) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();

      handleSendMessage();
    }
  };

  // =====================================================
  // FILTER CLIENTS
  // =====================================================

  const filteredClients =
    clients.filter((client) => {
      const searchText =
        search.toLowerCase();

      return (
        client.name
          .toLowerCase()
          .includes(searchText) ||
        client.company
          .toLowerCase()
          .includes(searchText) ||
        client.email
          .toLowerCase()
          .includes(searchText)
      );
    });

  // =====================================================
  // FORMAT TIME
  // =====================================================

  const formatMessageTime = (
    date: string
  ) => {
    return new Date(date).toLocaleString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

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

      {/* =================================================
          NAVBAR
      ================================================= */}

      <header className="fixed left-0 right-0 top-0 z-50 border-b border-white/10 bg-[#0b0f19]/95 backdrop-blur">

        <div className="flex h-16 items-center justify-between px-6">

          <Link
            href="/freelancer/dashboard"
            className="text-xl font-bold"
          >
            Freelancer
            <span className="text-blue-500">
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

      {/* =================================================
          SIDEBAR
      ================================================= */}

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
            className="block rounded-lg px-4 py-3 text-sm text-gray-400 transition hover:bg-white/5 hover:text-white"
          >
            Files
          </Link>

          <Link
            href="/freelancer/messages"
            className="block rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium"
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

      {/* =================================================
          MAIN
      ================================================= */}

      <main className="pt-16 md:ml-64">

        <div className="p-6 md:p-8">

          {/* HEADER */}

          <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">

            <div>

              <h1 className="text-3xl font-bold">
                Messages
              </h1>

              <p className="mt-2 text-gray-400">
                Communicate with your clients.
              </p>

            </div>

            <button
              onClick={loadInitialData}
              className="rounded-lg border border-white/10 bg-[#111827] px-5 py-3 text-sm text-gray-300 transition hover:bg-white/5"
            >
              ↻ Refresh
            </button>

          </div>

          {/* ERROR */}

          {error && (

            <div className="mb-5 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
              {error}
            </div>

          )}

          {/* SUCCESS */}

          {success && (

            <div className="mb-5 rounded-lg border border-green-500/20 bg-green-500/10 p-4 text-sm text-green-400">
              {success}
            </div>

          )}

          {/* =================================================
              MESSAGES CONTAINER
          ================================================= */}

          <div className="grid min-h-[650px] overflow-hidden rounded-xl border border-white/10 bg-[#111827] md:grid-cols-[300px_1fr]">

            {/* =================================================
                CLIENT LIST
            ================================================= */}

            <div className="border-b border-white/10 md:border-b-0 md:border-r">

              <div className="border-b border-white/10 p-5">

                <h2 className="font-semibold">
                  Conversations
                </h2>

                <p className="mt-1 text-xs text-gray-500">
                  {clients.length} client
                  {clients.length !== 1
                    ? "s"
                    : ""}
                </p>

                <input
                  type="text"
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value
                    )
                  }
                  placeholder="Search clients..."
                  className="mt-4 w-full rounded-lg border border-white/10 bg-[#0b0f19] px-3 py-2.5 text-sm text-white outline-none placeholder:text-gray-600 focus:border-blue-500"
                />

              </div>

              <div className="max-h-[550px] overflow-y-auto">

                {loading ? (

                  <div className="p-5 text-sm text-gray-500">
                    Loading clients...
                  </div>

                ) : filteredClients.length ===
                  0 ? (

                  <div className="p-5 text-center text-sm text-gray-500">
                    No clients found.
                  </div>

                ) : (

                  filteredClients.map(
                    (client) => {

                      const isSelected =
                        client._id ===
                        selectedClient;

                      return (

                        <button
                          key={client._id}
                          onClick={() =>
                            handleClientSelect(
                              client._id
                            )
                          }
                          className={`w-full border-b border-white/5 p-4 text-left transition ${
                            isSelected
                              ? "bg-blue-600/10"
                              : "hover:bg-white/[0.03]"
                          }`}
                        >

                          <div className="flex items-center gap-3">

                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-500/10 font-semibold text-blue-400">
                              {client.company
                                .charAt(0)
                                .toUpperCase()}
                            </div>

                            <div className="min-w-0">

                              <p
                                className={`truncate text-sm font-medium ${
                                  isSelected
                                    ? "text-blue-400"
                                    : "text-white"
                                }`}
                              >
                                {client.company}
                              </p>

                              <p className="truncate text-xs text-gray-500">
                                {client.name}
                              </p>

                            </div>

                          </div>

                        </button>

                      );
                    }
                  )

                )}

              </div>

            </div>

            {/* =================================================
                CHAT
            ================================================= */}

            <div className="flex min-h-[600px] flex-col">

              {!selectedClient ? (

                <div className="flex flex-1 flex-col items-center justify-center p-10 text-center">

                  <div className="text-5xl">
                    💬
                  </div>

                  <h2 className="mt-5 text-xl font-semibold">
                    Select a conversation
                  </h2>

                  <p className="mt-2 max-w-md text-sm text-gray-500">
                    Select a client from the left
                    to view your conversation.
                  </p>

                </div>

              ) : (

                <>

                  {/* CHAT HEADER */}

                  <div className="border-b border-white/10 p-5">

                    <div className="flex items-center gap-3">

                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-500/10 font-semibold text-blue-400">
                        {selectedClientData?.company
                          ?.charAt(0)
                          .toUpperCase()}
                      </div>

                      <div>

                        <h2 className="font-semibold">
                          {
                            selectedClientData?.company
                          }
                        </h2>

                        <p className="text-xs text-gray-500">
                          {
                            selectedClientData?.email
                          }
                        </p>

                      </div>

                    </div>

                  </div>

                  {/* MESSAGE LIST */}

                  <div className="flex-1 space-y-4 overflow-y-auto p-5">

                    {messages.length ===
                    0 ? (

                      <div className="flex h-full min-h-[400px] flex-col items-center justify-center text-center">

                        <div className="text-4xl">
                          💬
                        </div>

                        <h3 className="mt-4 font-semibold">
                          No messages yet
                        </h3>

                        <p className="mt-2 text-sm text-gray-500">
                          Start the conversation
                          with this client.
                        </p>

                      </div>

                    ) : (

                      messages.map(
                        (message) => {

                          const isFreelancer =
                            message.senderRole ===
                            "freelancer";

                          return (

                            <div
                              key={message._id}
                              className={`flex ${
                                isFreelancer
                                  ? "justify-end"
                                  : "justify-start"
                              }`}
                            >

                              <div
                                className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                                  isFreelancer
                                    ? "rounded-br-md bg-blue-600"
                                    : "rounded-bl-md bg-white/5"
                                }`}
                              >

                                <p className="whitespace-pre-wrap text-sm leading-6">
                                  {
                                    message.message
                                  }
                                </p>

                                <div
                                  className={`mt-2 text-[10px] ${
                                    isFreelancer
                                      ? "text-blue-100"
                                      : "text-gray-500"
                                  }`}
                                >
                                  {formatMessageTime(
                                    message.createdAt
                                  )}

                                  {message.project &&
                                    typeof message.project !==
                                      "string" && (
                                      <>
                                        {" • "}
                                        {
                                          message
                                            .project
                                            .name
                                        }
                                      </>
                                    )}
                                </div>

                              </div>

                            </div>

                          );
                        }
                      )

                    )}

                  </div>

                  {/* MESSAGE COMPOSER */}

                  <div className="border-t border-white/10 p-5">

                    {/* PROJECT SELECT */}

                    <div className="mb-3">

                      <select
                        value={selectedProject}
                        onChange={(event) =>
                          setSelectedProject(
                            event.target.value
                          )
                        }
                        className="w-full rounded-lg border border-white/10 bg-[#0b0f19] px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500"
                      >

                        <option value="">
                          General conversation
                        </option>

                        {availableProjects.map(
                          (project) => (

                            <option
                              key={project._id}
                              value={
                                project._id
                              }
                            >
                              {project.name}
                            </option>

                          )
                        )}

                      </select>

                    </div>

                    <div className="flex gap-3">

                      <textarea
                        value={messageText}
                        onChange={(event) =>
                          setMessageText(
                            event.target.value
                          )
                        }
                        onKeyDown={
                          handleKeyDown
                        }
                        placeholder="Type your message..."
                        rows={2}
                        className="flex-1 resize-none rounded-lg border border-white/10 bg-[#0b0f19] px-4 py-3 text-sm text-white outline-none placeholder:text-gray-600 focus:border-blue-500"
                      />

                      <button
                        onClick={
                          handleSendMessage
                        }
                        disabled={
                          sending ||
                          !messageText.trim()
                        }
                        className="self-end rounded-lg bg-blue-600 px-5 py-3 text-sm font-medium transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {sending
                          ? "Sending..."
                          : "Send"}
                      </button>

                    </div>

                    <p className="mt-2 text-[11px] text-gray-600">
                      Press Enter to send •
                      Shift + Enter for a new
                      line
                    </p>

                  </div>

                </>

              )}

            </div>

          </div>

          {/* FOOTER */}

          <div className="mt-10 border-t border-white/10 py-6 text-center text-sm text-gray-600">
            FreelancerPortal © 2026 — Freelancer
            Invoice & Client Portal
          </div>

        </div>

      </main>

    </div>
  );
}