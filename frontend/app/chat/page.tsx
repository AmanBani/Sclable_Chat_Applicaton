"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import { useWebSocket } from "@/hooks/useWebSocket";
import { ConversationList } from "@/components/chat/ConversationList";
import { MessagePane } from "@/components/chat/MessagePane";
import { getMessages } from "@/lib/api";
import { MessageCircle } from "lucide-react";
import type { Message } from "@/lib/api";

type Conversation = {
  otherUser: string;
  lastMessage: string;
  lastTime: string;
};

function formatTime(ts: string): string {
  const d = new Date(ts);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

export default function ChatPage() {
  const { username, token } = useAuthStore();
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [search, setSearch] = useState("");
  const { messages: wsMessages, addIncoming, clearMessages } = useWebSocket(username);

  const loadConversations = async () => {
    if (!username || !token) return;
    try {
      const res = await getMessages(username, token);
      const msgs = res.messages || [];
      const byOther: Record<string, { lastMessage: string; lastTime: string }> = {};
      for (const m of msgs) {
        const other = m.sender === username ? m.receiver : m.sender;
        const t = new Date(m.timestamp).getTime();
        if (!byOther[other] || t > new Date(byOther[other].lastTime).getTime()) {
          byOther[other] = { lastMessage: m.content, lastTime: m.timestamp };
        }
      }
      setConversations(
        Object.entries(byOther).map(([otherUser, { lastMessage, lastTime }]) => ({
          otherUser,
          lastMessage,
          lastTime: formatTime(lastTime),
        }))
      );
    } catch {
      setConversations([]);
    }
  };

  useEffect(() => {
    loadConversations();
  }, [username, token]);

  useEffect(() => {
    if (wsMessages.length > 0) loadConversations();
  }, [wsMessages.length]);

  const showChat = !!selectedUser;
  const filtered = conversations.filter((c) =>
    c.otherUser.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-screen flex flex-col bg-black overflow-hidden">
      {/* Top bar: full width, border */}
      <header className="shrink-0 flex items-center gap-3 px-4 py-3 border-b border-white/25 bg-black">
        <ConversationList
          mode="topbar"
          username={username || ""}
          token={token || ""}
          conversations={conversations}
          selectedUser={selectedUser}
          onSelect={setSelectedUser}
          onRefresh={loadConversations}
          search={search}
          onSearchChange={setSearch}
        />
      </header>

      {/* Sidebar + Main: sidebar first, then main on same row on desktop */}
      <div className="flex-1 flex min-h-0">
        <aside
          className={cn(
            "w-full md:w-64 shrink-0 flex flex-col border-r border-white/25 bg-black overflow-hidden",
            showChat && "hidden md:flex"
          )}
        >
          <ConversationList
            mode="sidebar"
            username={username || ""}
            token={token || ""}
            conversations={filtered}
            selectedUser={selectedUser}
            onSelect={setSelectedUser}
            onRefresh={loadConversations}
            search={search}
            onSearchChange={setSearch}
          />
        </aside>

        <main
          className={cn(
            "flex-1 flex flex-col min-w-0 bg-black border-l border-white/25 md:border-l-0",
            !showChat && "hidden md:flex"
          )}
        >
          {selectedUser ? (
            <MessagePane
              currentUser={username || ""}
              otherUser={selectedUser}
              token={token || ""}
              messages={messages}
              setMessages={setMessages}
              wsMessages={wsMessages}
              addIncoming={addIncoming}
              clearMessages={clearMessages}
              onBack={() => setSelectedUser(null)}
              onMessageSent={loadConversations}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border border-white/25 rounded m-4">
              <div className="w-16 h-16 rounded-full border border-white/25 flex items-center justify-center mb-4">
                <MessageCircle className="w-8 h-8 text-white" />
              </div>
              <p className="font-bold text-white text-lg mb-2">Stay connected</p>
              <p className="text-white text-sm">
                Select a conversation or start a new chat
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
