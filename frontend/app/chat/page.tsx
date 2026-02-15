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
    if (wsMessages.length > 0) {
      loadConversations();
    }
  }, [wsMessages.length]);

  const showSidebar = !selectedUser;
  const showChat = !!selectedUser;

  return (
    <div className="flex h-screen bg-chat-pane overflow-hidden">
      {/* Sidebar - WhatsApp style */}
      <div
        className={cn(
          "w-full md:w-[400px] shrink-0 flex flex-col bg-chat-sidebar border-r border-white/20",
          "absolute md:relative inset-0 z-10 md:z-auto",
          showChat && "hidden md:flex"
        )}
      >
        <ConversationList
          username={username || ""}
          token={token || ""}
          conversations={conversations}
          selectedUser={selectedUser}
          onSelect={(u) => setSelectedUser(u)}
          onRefresh={loadConversations}
        />
      </div>

      {/* Chat pane */}
      <div className={cn("flex-1 flex flex-col min-w-0", !showChat && "hidden md:flex")}>
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
          <div className="flex-1 flex flex-col items-center justify-center bg-chat-pane text-white/60 border border-white/10 rounded-xl m-6 p-8 max-w-lg text-center">
            <div className="w-20 h-20 rounded-full bg-chat-accent/30 flex items-center justify-center mb-6 mx-auto border border-white/20">
              <MessageCircle className="w-10 h-10 text-white/80" />
            </div>
            <p className="text-xl font-medium text-white/80 mb-2">Stay connected</p>
            <p className="text-sm mb-6">
              Select a conversation from the list, or start a new chat with any user
            </p>
            <p className="text-xs text-white/50">
              Multiple users can connect and communicate in real time
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
