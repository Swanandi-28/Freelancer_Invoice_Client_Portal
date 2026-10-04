import MessagesInbox from "@/components/MessagesInbox";

// Client <-> freelancer conversations (one per freelancer relationship).
export default function ClientMessagesPage() {
  return <MessagesInbox role="client" />;
}
