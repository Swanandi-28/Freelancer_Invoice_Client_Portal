"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { formatDateTime, inputClass } from "@/components/ui";

type ChatMessage = {
  _id: string;
  senderRole: "freelancer" | "client";
  message: string;
  // read = the RECIPIENT has opened the conversation (stored in MongoDB)
  read: boolean;
  createdAt: string;
  project?: { _id: string; name: string } | null;
};

export type ChatProject = { _id: string; name: string };

// How often an open conversation checks for new messages / read receipts.
const POLL_INTERVAL_MS = 6000;

/*
  One private conversation = one freelancer-client relationship
  (clientId is the Client relationship id). The server checks that
  the logged-in user belongs to that relationship on every request.

  - Messages are loaded from and saved to MongoDB (nothing is kept only
    in React state).
  - Opening the conversation marks the OTHER person's messages as read
    (PATCH /api/messages/read). The user's own messages show
    "✓ Sent" until the recipient opens the conversation, then "✓✓ Read".
*/
export default function ChatThread({
  clientId,
  viewerRole,
  projects = [],
  onActivity,
}: {
  clientId: string;
  viewerRole: "freelancer" | "client";
  /** Projects of this relationship; a message can optionally be about one. */
  projects?: ChatProject[];
  /** Called after messages were sent or marked read (to refresh badges). */
  onActivity?: () => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [projectId, setProjectId] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const scrollRef = useRef<HTMLDivElement>(null);
  const onActivityRef = useRef(onActivity);

  useEffect(() => {
    onActivityRef.current = onActivity;
  }, [onActivity]);

  const loadMessages = useCallback(
    async (silent = false) => {
      try {
        if (!silent) setLoading(true);

        const response = await fetch(
          `/api/messages?clientId=${encodeURIComponent(clientId)}`,
          { cache: "no-store" }
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to load messages.");
        }

        let loaded: ChatMessage[] = data.messages || [];

        // The conversation is open on screen: tell the server that the
        // other person's messages have now been seen.
        const hasUnreadIncoming = loaded.some(
          (message) => message.senderRole !== viewerRole && !message.read
        );

        if (hasUnreadIncoming && !document.hidden) {
          const readResponse = await fetch("/api/messages/read", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ clientId }),
          });

          if (readResponse.ok) {
            loaded = loaded.map((message) =>
              message.senderRole !== viewerRole
                ? { ...message, read: true }
                : message
            );
            onActivityRef.current?.();
          }
        }

        setMessages(loaded);
        setError("");
      } catch (reason) {
        if (!silent) {
          setError(
            reason instanceof Error ? reason.message : "Failed to load messages."
          );
        }
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [clientId, viewerRole]
  );

  useEffect(() => {
    loadMessages();

    // Simple polling so replies and read receipts appear without a
    // manual refresh.
    const timer = setInterval(() => loadMessages(true), POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [loadMessages]);

  // Keep the newest message in view.
  useEffect(() => {
    const container = scrollRef.current;
    if (container) container.scrollTop = container.scrollHeight;
  }, [messages.length]);

  const sendMessage = async (event: React.FormEvent) => {
    event.preventDefault();

    const trimmed = text.trim();
    if (!trimmed || sending) return;

    try {
      setSending(true);
      setError("");

      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          message: trimmed,
          projectId: projectId || undefined,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to send message.");
      }

      setText("");

      // Show the saved message straight away, then re-sync with MongoDB.
      if (data.message?._id) {
        setMessages((current) => [...current, data.message as ChatMessage]);
      }
      await loadMessages(true);
      onActivityRef.current?.();
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Failed to send message."
      );
    } finally {
      setSending(false);
    }
  };

  const otherParty = viewerRole === "freelancer" ? "client" : "freelancer";

  return (
    <div className="flex min-h-[420px] flex-1 flex-col">
      <div
        ref={scrollRef}
        className="max-h-[480px] flex-1 space-y-3 overflow-y-auto p-5"
      >
        {loading ? (
          <p className="py-10 text-center text-sm text-gray-500">
            Loading messages...
          </p>
        ) : messages.length === 0 ? (
          <p className="py-10 text-center text-sm text-gray-500">
            No messages yet. Start a conversation with your {otherParty}.
          </p>
        ) : (
          messages.map((message) => {
            const mine = message.senderRole === viewerRole;

            return (
              <div
                key={message._id}
                className={`flex ${mine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                    mine
                      ? "bg-blue-600 text-white"
                      : "border border-white/10 bg-white/5 text-gray-200"
                  }`}
                >
                  <p className="mb-1 text-xs font-medium opacity-70">
                    <span className="capitalize">
                      {mine ? "You" : message.senderRole}
                    </span>
                    {message.project?.name && ` · ${message.project.name}`}
                  </p>
                  <p className="whitespace-pre-wrap break-words">
                    {message.message}
                  </p>
                  <p className="mt-1 flex items-center justify-end gap-2 text-[11px] opacity-70">
                    <span>{formatDateTime(message.createdAt)}</span>
                    {mine && (
                      <span
                        data-read={message.read ? "true" : "false"}
                        title={
                          message.read
                            ? `Read by the ${otherParty}`
                            : `Sent - not read by the ${otherParty} yet`
                        }
                        className={message.read ? "font-semibold text-sky-200" : ""}
                      >
                        {message.read ? "✓✓ Read" : "✓ Sent"}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {error && (
        <p role="alert" className="px-5 pb-2 text-sm text-red-400">
          {error}
        </p>
      )}

      <form
        onSubmit={sendMessage}
        className="flex flex-col gap-3 border-t border-white/10 p-4 sm:flex-row"
      >
        {projects.length > 0 && (
          <select
            value={projectId}
            onChange={(event) => setProjectId(event.target.value)}
            aria-label="Project this message is about"
            className={`${inputClass} sm:w-48 sm:flex-none`}
          >
            <option value="">General</option>
            {projects.map((project) => (
              <option key={project._id} value={project._id}>
                {project.name}
              </option>
            ))}
          </select>
        )}
        <input
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Type a message..."
          maxLength={5000}
          className={inputClass}
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-medium transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {sending ? "Sending..." : "Send"}
        </button>
      </form>
    </div>
  );
}
