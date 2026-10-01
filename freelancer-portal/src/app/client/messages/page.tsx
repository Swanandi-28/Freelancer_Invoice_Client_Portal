"use client";

import { useState } from "react";
import Link from "next/link";

type Message = {
  id: number;
  sender: "client" | "freelancer";
  text: string;
  time: string;
};

type Conversation = {
  id: number;
  freelancer: string;
  company: string;
  project: string;
  unread: number;
  messages: Message[];
};

const initialConversations: Conversation[] = [
  {
    id: 1,
    freelancer: "Rahul Sharma",
    company: "ABC Company",
    project: "E-commerce Website",
    unread: 2,
    messages: [
      {
        id: 1,
        sender: "freelancer",
        text: "Hello! I've completed the latest homepage changes.",
        time: "10:30 AM",
      },
      {
        id: 2,
        sender: "client",
        text: "Great. Can you also update the product section?",
        time: "10:42 AM",
      },
      {
        id: 3,
        sender: "freelancer",
        text: "Yes, I'll work on that today.",
        time: "10:45 AM",
      },
    ],
  },
  {
    id: 2,
    freelancer: "Priya Mehta",
    company: "XYZ Solutions",
    project: "Brand Identity Design",
    unread: 1,
    messages: [
      {
        id: 1,
        sender: "freelancer",
        text: "I've uploaded the latest logo concepts.",
        time: "Yesterday",
      },
      {
        id: 2,
        sender: "client",
        text: "I'll review them and get back to you.",
        time: "Yesterday",
      },
    ],
  },
];

export default function ClientMessagesPage() {
  const [conversations, setConversations] = useState(
    initialConversations
  );

  const [selectedId, setSelectedId] = useState(1);
  const [messageText, setMessageText] = useState("");

  const selectedConversation = conversations.find(
    (conversation) => conversation.id === selectedId
  );

  const selectConversation = (id: number) => {
    setSelectedId(id);

    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === id
          ? { ...conversation, unread: 0 }
          : conversation
      )
    );
  };

  const sendMessage = () => {
    if (!messageText.trim()) {
      return;
    }

    setConversations((current) =>
      current.map((conversation) => {
        if (conversation.id !== selectedId) {
          return conversation;
        }

        return {
          ...conversation,
          messages: [
            ...conversation.messages,
            {
              id: Date.now(),
              sender: "client",
              text: messageText,
              time: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
            },
          ],
        };
      })
    );

    setMessageText("");
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
          <h1 className="text-3xl font-bold">Messages</h1>

          <p className="text-slate-400 mt-2">
            Communicate directly with your freelancers.
          </p>
        </div>

        {/* Messaging Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden min-h-[650px]">

          {/* Conversations */}
          <div className="border-b md:border-b-0 md:border-r border-slate-800">
            <div className="p-5 border-b border-slate-800">
              <h2 className="font-semibold text-lg">
                Conversations
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                Your freelancer contacts
              </p>
            </div>

            <div>
              {conversations.map((conversation) => (
                <button
                  key={conversation.id}
                  onClick={() =>
                    selectConversation(conversation.id)
                  }
                  className={`w-full text-left p-5 border-b border-slate-800 transition ${
                    selectedId === conversation.id
                      ? "bg-blue-600/10 border-l-2 border-l-blue-500"
                      : "hover:bg-slate-800/50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-blue-600 flex items-center justify-center font-bold">
                        {conversation.freelancer.charAt(0)}
                      </div>

                      <div>
                        <p className="font-medium">
                          {conversation.freelancer}
                        </p>

                        <p className="text-xs text-slate-500 mt-1">
                          {conversation.project}
                        </p>
                      </div>
                    </div>

                    {conversation.unread > 0 && (
                      <span className="min-w-6 h-6 px-2 rounded-full bg-blue-600 text-xs flex items-center justify-center">
                        {conversation.unread}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Chat */}
          <div className="md:col-span-2 flex flex-col">

            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-5 border-b border-slate-800 flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-blue-600 flex items-center justify-center font-bold">
                    {selectedConversation.freelancer.charAt(0)}
                  </div>

                  <div>
                    <h2 className="font-semibold">
                      {selectedConversation.freelancer}
                    </h2>

                    <p className="text-sm text-slate-500">
                      {selectedConversation.company} •{" "}
                      {selectedConversation.project}
                    </p>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 p-6 space-y-5 overflow-y-auto">
                  {selectedConversation.messages.map(
                    (message) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.sender === "client"
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[75%] ${
                            message.sender === "client"
                              ? "items-end"
                              : "items-start"
                          } flex flex-col`}
                        >
                          <div
                            className={`px-4 py-3 rounded-2xl ${
                              message.sender === "client"
                                ? "bg-blue-600 rounded-br-md"
                                : "bg-slate-800 rounded-bl-md"
                            }`}
                          >
                            <p className="text-sm">
                              {message.text}
                            </p>
                          </div>

                          <span className="text-xs text-slate-600 mt-1">
                            {message.time}
                          </span>
                        </div>
                      </div>
                    )
                  )}
                </div>

                {/* Message Input */}
                <div className="p-5 border-t border-slate-800">
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={messageText}
                      onChange={(e) =>
                        setMessageText(e.target.value)
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          sendMessage();
                        }
                      }}
                      placeholder="Type your message..."
                      className="flex-1 px-4 py-3 rounded-lg bg-slate-950 border border-slate-700 focus:outline-none focus:border-blue-500"
                    />

                    <button
                      onClick={sendMessage}
                      className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 font-medium"
                    >
                      Send
                    </button>
                  </div>

                  <p className="text-xs text-slate-600 mt-2">
                    Press Enter to send a message.
                  </p>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-slate-500">
                  Select a conversation.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Information */}
        <div className="mt-6 bg-blue-500/10 border border-blue-500/20 rounded-xl p-5">
          <p className="text-blue-300 text-sm">
            <span className="font-semibold">Messaging:</span>{" "}
            Messages are currently stored only in the page state.
            Later, they will be stored in MongoDB and associated
            with the correct freelancer-client workspace.
          </p>
        </div>
      </div>
    </main>
  );
}