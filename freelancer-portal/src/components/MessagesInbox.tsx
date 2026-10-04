"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import ChatThread, { type ChatProject } from "@/components/ChatThread";
import { ErrorBanner, LoadingState, PageHeader, inputClass } from "@/components/ui";

/*
  Messages page shared by both roles.

    freelancer: one conversation per client relationship
    client:     one conversation per freelancer relationship

  A conversation id is always the Client relationship id, so
  "Freelancer A <-> ABC Company" and "Freelancer B <-> ABC Company"
  are two separate conversations that can never mix.

  Everything comes from MongoDB through the APIs:
    conversations  /api/clients (freelancer) or /api/dashboard/client (client)
    projects       /api/projects
    unread counts  /api/messages/unread
    messages       /api/messages?clientId=...   (inside ChatThread)
*/

type Conversation = {
  id: string; // Client relationship id
  title: string; // who the conversation is with
  subtitle: string;
};

type ApiClient = { _id: string; name: string; company: string; email: string };

type ApiRelationship = {
  id: string;
  company: string;
  freelancer: { name: string; email: string } | null;
};

type ApiProject = {
  _id: string;
  name: string;
  client?: { _id: string } | string | null;
};

const UNREAD_POLL_MS = 8000;

export default function MessagesInbox({
  role,
}: {
  role: "freelancer" | "client";
}) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [projectsByConversation, setProjectsByConversation] = useState<
    Record<string, ChatProject[]>
  >({});
  const [unread, setUnread] = useState<Record<string, number>>({});
  const [selectedId, setSelectedId] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadUnread = useCallback(async () => {
    try {
      const response = await fetch("/api/messages/unread", { cache: "no-store" });
      const data = await response.json();
      if (response.ok) setUnread(data.unread || {});
    } catch {
      // Badges will catch up on the next poll.
    }
  }, []);

  const loadConversations = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [conversationsResponse, projectsResponse] = await Promise.all([
        fetch(role === "freelancer" ? "/api/clients" : "/api/dashboard/client", {
          cache: "no-store",
        }),
        fetch("/api/projects", { cache: "no-store" }),
      ]);

      const conversationsData = await conversationsResponse.json();
      const projectsData = await projectsResponse.json();

      if (!conversationsResponse.ok) {
        throw new Error(
          conversationsData.message || "Failed to load conversations."
        );
      }

      const list: Conversation[] =
        role === "freelancer"
          ? ((conversationsData.clients || []) as ApiClient[]).map((client) => ({
              id: client._id,
              title: client.company || client.name,
              subtitle: `${client.name} · ${client.email}`,
            }))
          : ((conversationsData.freelancers || []) as ApiRelationship[]).map(
              (relationship) => ({
                id: relationship.id,
                title: relationship.freelancer?.name || "Freelancer",
                subtitle: `${relationship.freelancer?.email || ""} · ${relationship.company}`,
              })
            );

      const grouped: Record<string, ChatProject[]> = {};

      if (projectsResponse.ok) {
        for (const project of (projectsData.projects || []) as ApiProject[]) {
          const clientId =
            typeof project.client === "string"
              ? project.client
              : project.client?._id;
          if (!clientId) continue;
          (grouped[clientId] ||= []).push({ _id: project._id, name: project.name });
        }
      }

      setConversations(list);
      setProjectsByConversation(grouped);

      const requested = new URLSearchParams(window.location.search).get(
        "conversation"
      );

      setSelectedId((current) =>
        list.some((item) => item.id === current)
          ? current
          : list.find((item) => item.id === requested)?.id ||
            // With several conversations nothing is opened automatically,
            // so messages are only marked read when the user picks one.
            (list.length === 1 ? list[0].id : "")
      );

      await loadUnread();
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Failed to load conversations."
      );
    } finally {
      setLoading(false);
    }
  }, [role, loadUnread]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Keep unread badges up to date without a page refresh.
  useEffect(() => {
    const timer = setInterval(loadUnread, UNREAD_POLL_MS);
    return () => clearInterval(timer);
  }, [loadUnread]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return conversations;

    return conversations.filter((conversation) => {
      const projectNames = (projectsByConversation[conversation.id] || [])
        .map((project) => project.name)
        .join(" ");
      return `${conversation.title} ${conversation.subtitle} ${projectNames}`
        .toLowerCase()
        .includes(term);
    });
  }, [conversations, projectsByConversation, search]);

  const selected = conversations.find((item) => item.id === selectedId);
  const selectedProjects = projectsByConversation[selectedId] || [];
  const totalUnread = Object.values(unread).reduce((sum, count) => sum + count, 0);
  const other = role === "freelancer" ? "client" : "freelancer";

  return (
    <div className="p-4 md:p-8">
      <PageHeader
        title="Messages"
        subtitle={
          role === "freelancer"
            ? "Private conversations with each of your clients."
            : "Private conversations with each of your freelancers."
        }
        action={
          <span
            data-testid="total-unread"
            className={`self-start rounded-full px-4 py-2 text-sm ${
              totalUnread > 0
                ? "bg-blue-600 font-medium text-white"
                : "border border-white/10 text-gray-400"
            }`}
          >
            {totalUnread} unread
          </span>
        }
      />

      <ErrorBanner message={error} onRetry={loadConversations} />

      {loading ? (
        <LoadingState label="Loading conversations..." />
      ) : conversations.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-[#111827] p-10 text-center text-gray-400">
          {role === "freelancer"
            ? "No clients yet. Add a client to start a conversation."
            : "No conversations yet. Once a freelancer adds you as a client, you can message them here."}
        </div>
      ) : (
        <div className="grid overflow-hidden rounded-2xl border border-white/10 bg-[#111827] md:grid-cols-[300px_1fr]">
          {/* CONVERSATION LIST */}
          <div className="border-b border-white/10 md:border-b-0 md:border-r">
            <div className="border-b border-white/10 p-3">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={`Search ${other}s or projects...`}
                className={inputClass}
              />
            </div>

            {filtered.length === 0 ? (
              <p className="px-5 py-6 text-sm text-gray-500">
                No conversations match your search.
              </p>
            ) : (
              filtered.map((conversation) => {
                const count = unread[conversation.id] || 0;
                const projectNames = (projectsByConversation[conversation.id] || [])
                  .map((project) => project.name)
                  .join(", ");

                return (
                  <button
                    key={conversation.id}
                    data-conversation={conversation.id}
                    onClick={() => setSelectedId(conversation.id)}
                    className={`flex w-full items-center justify-between gap-3 border-b border-white/5 px-5 py-4 text-left transition last:border-0 ${
                      conversation.id === selectedId
                        ? "bg-blue-600/15"
                        : "hover:bg-white/5"
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{conversation.title}</p>
                      <p className="truncate text-xs text-gray-500">
                        {projectNames || "No projects yet"}
                      </p>
                    </div>
                    <span
                      data-testid="unread-count"
                      title={`${count} unread`}
                      className={`min-w-[1.75rem] rounded-full px-2 py-0.5 text-center text-xs font-medium ${
                        count > 0
                          ? "bg-blue-600 text-white"
                          : "bg-white/5 text-gray-500"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })
            )}
          </div>

          {/* CHAT */}
          <div className="flex min-w-0 flex-col">
            {!selected && (
              <div className="flex h-full min-h-[420px] items-center justify-center p-10 text-center text-sm text-gray-500">
                Select a {other} to open the conversation.
              </div>
            )}

            {selected && (
              <>
                <div className="border-b border-white/10 px-5 py-4">
                  <p className="font-semibold">{selected.title}</p>
                  <p className="truncate text-xs text-gray-500">
                    {selected.subtitle}
                  </p>
                  <p className="mt-1 truncate text-xs text-gray-400">
                    {selectedProjects.length > 0
                      ? `Projects: ${selectedProjects.map((project) => project.name).join(", ")}`
                      : "No projects yet"}
                  </p>
                </div>
                <ChatThread
                  key={selected.id}
                  clientId={selected.id}
                  viewerRole={role}
                  projects={selectedProjects}
                  onActivity={loadUnread}
                />
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
