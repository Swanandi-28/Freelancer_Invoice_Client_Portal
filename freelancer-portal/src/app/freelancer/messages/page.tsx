"use client";

import { useState } from "react";
import Link from "next/link";

type Message = {
  id: number;
  sender: "Freelancer" | "Client";
  text: string;
  time: string;
};

type Conversation = {
  id: number;
  client: string;
  company: string;
  project: string;
  lastMessage: string;
  time: string;
  unread: number;
};

const initialConversations: Conversation[] = [
  {
    id: 1,
    client: "Rahul Sharma",
    company: "ABC Company",
    project: "E-commerce Website",
    lastMessage: "Can you share the latest design?",
    time: "10:30 AM",
    unread: 2,
  },
  {
    id: 2,
    client: "Priya Mehta",
    company: "XYZ Solutions",
    project: "Brand Identity Design",
    lastMessage: "The logo looks great!",
    time: "Yesterday",
    unread: 0,
  },
  {
    id: 3,
    client: "Amit Patil",
    company: "Tech Startup",
    project: "Mobile App UI",
    lastMessage: "I have reviewed the screens.",
    time: "28 Sep",
    unread: 1,
  },
];

const initialMessages: Record<number, Message[]> = {
  1: [
    {
      id: 1,
      sender: "Client",
      text: "Hi, how is the website development going?",
      time: "10:10 AM",
    },
    {
      id: 2,
      sender: "Freelancer",
      text: "Hi Rahul! The main pages are completed. I am working on the checkout section now.",
      time: "10:18 AM",
    },
    {
      id: 3,
      sender: "Client",
      text: "Can you share the latest design?",
      time: "10:30 AM",
    },
  ],
  2: [
    {
      id: 1,
      sender: "Freelancer",
      text: "I have uploaded the updated logo variations.",
      time: "Yesterday",
    },
    {
      id: 2,
      sender: "Client",
      text: "The logo looks great!",
      time: "Yesterday",
    },
  ],
  3: [
    {
      id: 1,
      sender: "Client",
      text: "I have reviewed the screens.",
      time: "28 Sep",
    },
  ],
};

export default function MessagesPage() {
  const [conversations, setConversations] =
    useState<Conversation[]>(initialConversations);

  const [selectedConversation, setSelectedConversation] =
    useState<number>(1);

  const [messages, setMessages] =
    useState<Record<number, Message[]>>(initialMessages);

  const [messageText, setMessageText] = useState("");

  const conversation = conversations.find(
    (item) => item.id === selectedConversation
  );

  const currentMessages =
    messages[selectedConversation] || [];

  function selectConversation(id: number) {
    setSelectedConversation(id);

    setConversations((previous) =>
      previous.map((item) =>
        item.id === id
          ? { ...item, unread: 0 }
          : item
      )
    );
  }

  function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();

    if (!messageText.trim()) {
      return;
    }

    const newMessage: Message = {
      id: Date.now(),
      sender: "Freelancer",
      text: messageText.trim(),
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((previous) => ({
      ...previous,
      [selectedConversation]: [
        ...(previous[selectedConversation] || []),
        newMessage,
      ],
    }));

    setConversations((previous) =>
      previous.map((item) =>
        item.id === selectedConversation
          ? {
              ...item,
              lastMessage: messageText.trim(),
              time: "Just now",
            }
          : item
      )
    );

    setMessageText("");
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
            />

            <SidebarLink
              href="/freelancer/messages"
              label="Messages"
              icon="💬"
              active
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
          <div className="mb-8">
            <h1 className="text-3xl font-bold">
              Messages
            </h1>

            <p className="text-slate-400 mt-2">
              Communicate with your clients and manage project conversations.
            </p>
          </div>

          {/* Messaging Layout */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden h-[650px] flex">
            {/* Conversation List */}
            <div className="w-full md:w-80 border-r border-slate-800 flex flex-col">
              <div className="p-5 border-b border-slate-800">
                <h2 className="font-semibold">
                  Conversations
                </h2>

                <p className="text-xs text-slate-500 mt-1">
                  {conversations.length} active conversations
                </p>
              </div>

              <div className="flex-1 overflow-y-auto">
                {conversations.map((item) => (
                  <button
                    key={item.id}
                    onClick={() =>
                      selectConversation(item.id)
                    }
                    className={`w-full text-left p-5 border-b border-slate-800 transition ${
                      selectedConversation === item.id
                        ? "bg-blue-600/10 border-l-2 border-l-blue-500"
                        : "hover:bg-slate-800/50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-semibold shrink-0">
                          {item.client.charAt(0)}
                        </div>

                        <div className="min-w-0">
                          <p className="font-medium truncate">
                            {item.client}
                          </p>

                          <p className="text-xs text-slate-500 truncate">
                            {item.company}
                          </p>
                        </div>
                      </div>

                      {item.unread > 0 && (
                        <span className="bg-blue-600 text-white text-xs rounded-full min-w-5 h-5 flex items-center justify-center">
                          {item.unread}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-blue-400 mt-3">
                      {item.project}
                    </p>

                    <div className="flex justify-between gap-3 mt-2">
                      <p className="text-xs text-slate-400 truncate">
                        {item.lastMessage}
                      </p>

                      <span className="text-[11px] text-slate-600 whitespace-nowrap">
                        {item.time}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Area */}
            <div className="hidden md:flex flex-1 flex-col">
              {conversation ? (
                <>
                  {/* Chat Header */}
                  <div className="p-5 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-semibold">
                        {conversation.client.charAt(0)}
                      </div>

                      <div>
                        <h2 className="font-semibold">
                          {conversation.client}
                        </h2>

                        <p className="text-xs text-slate-500">
                          {conversation.company} ·{" "}
                          {conversation.project}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-5">
                    {currentMessages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.sender === "Freelancer"
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[70%] ${
                            message.sender === "Freelancer"
                              ? "items-end"
                              : "items-start"
                          } flex flex-col`}
                        >
                          <div
                            className={`px-4 py-3 rounded-2xl text-sm ${
                              message.sender === "Freelancer"
                                ? "bg-blue-600 text-white rounded-br-sm"
                                : "bg-slate-800 text-slate-200 rounded-bl-sm"
                            }`}
                          >
                            {message.text}
                          </div>

                          <span className="text-[11px] text-slate-600 mt-1">
                            {message.time}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Message Input */}
                  <form
                    onSubmit={handleSendMessage}
                    className="p-5 border-t border-slate-800 flex gap-3"
                  >
                    <input
                      type="text"
                      value={messageText}
                      onChange={(e) =>
                        setMessageText(e.target.value)
                      }
                      placeholder="Type a message..."
                      className="flex-1 px-4 py-3 rounded-lg bg-slate-950 border border-slate-700 focus:outline-none focus:border-blue-500"
                    />

                    <button
                      type="submit"
                      className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 font-medium"
                    >
                      Send
                    </button>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-slate-500">
                  Select a conversation
                </div>
              )}
            </div>
          </div>

          <p className="text-xs text-slate-600 mt-4">
            Messaging is currently stored in temporary frontend state.
          </p>
        </section>
      </div>
    </main>
  );
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