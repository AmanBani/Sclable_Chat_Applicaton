"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Phone, Video, MoreVertical, ArrowLeft } from "lucide-react";
import { MessageBubble } from "./MessageBubble";
import { ChatInput } from "./ChatInput";
import { getConversation, sendMessage } from "@/lib/api";
import type { Message } from "@/lib/api";
import type { IncomingMessage } from "@/hooks/useWebSocket";
import { cn } from "@/lib/utils";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

type Props = {
  currentUser: string;
  otherUser: string;
  token: string;
  messages: Message[];
  setMessages: (msgs: Message[] | ((prev: Message[]) => Message[])) => void;
  wsMessages: IncomingMessage[];
  addIncoming: (msg: IncomingMessage) => void;
  clearMessages: () => void;
  onBack?: () => void;
  onMessageSent?: () => void;
};

export function MessagePane({
  currentUser,
  otherUser,
  token,
  messages,
  setMessages,
  wsMessages,
  addIncoming,
  clearMessages,
  onBack,
  onMessageSent,
}: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;
    getConversation(currentUser, otherUser, token)
      .then((res) => {
        if (!mounted) return;
        const conv = res.conversation || [];
        setMessages(
          conv.map((m: { sender: string; receiver: string; content: string; status: string; timestamp: string }) => ({
            sender: m.sender,
            receiver: m.receiver,
            content: m.content,
            status: m.status,
            timestamp: m.timestamp,
          }))
        );
      })
      .catch(() => setMessages([]));
    return () => { mounted = false; };
  }, [currentUser, otherUser, token, setMessages]);

  useEffect(() => {
    // Only add messages we RECEIVED via WebSocket. Our own sent messages are added from handleSend.
    const relevant = wsMessages.filter(
      (m) => m.sender === otherUser && m.receiver === currentUser
    );
    for (const m of relevant) {
      setMessages((prev) => {
        const exists = prev.some(
          (p) =>
            p.content === m.content &&
            (p.sender === m.sender && p.receiver === m.receiver)
        );
        if (exists) return prev;
        return [
          ...prev,
          {
            sender: m.sender,
            receiver: m.receiver,
            content: m.content,
            status: "delivered",
            timestamp: new Date().toISOString(),
          },
        ];
      });
    }
  }, [wsMessages, currentUser, otherUser, setMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (content: string) => {
    try {
      const sent = await sendMessage(currentUser, otherUser, content, token);
      setMessages((prev) => [
        ...prev,
        {
          sender: sent.sender,
          receiver: sent.receiver,
          content: sent.content,
          status: sent.status,
          timestamp: sent.timestamp,
        },
      ]);
      onMessageSent?.();
    } catch (err) {
      console.error("Failed to send:", err);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Chat header - WhatsApp style */}
      <div className="h-16 px-4 flex items-center gap-3 bg-chat-pane-header border-b border-white/20 shrink-0">
        <button
          className="md:hidden p-2 -ml-2 rounded-full hover:bg-white/10 text-white"
          aria-label="Back"
          onClick={onBack}
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <div className="w-10 h-10 rounded-full bg-chat-accent flex items-center justify-center text-white font-semibold text-sm shrink-0">
          {getInitials(otherUser)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-white truncate">{otherUser}</p>
          <p className="text-xs text-white/60">Click to view profile</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            className="p-2 rounded-full text-white/80 hover:bg-white/10"
            aria-label="Voice call"
          >
            <Phone className="w-5 h-5" />
          </button>
          <button
            className="p-2 rounded-full text-white/80 hover:bg-white/10"
            aria-label="Video call"
          >
            <Video className="w-5 h-5" />
          </button>
          <button
            className="p-2 rounded-full text-white/80 hover:bg-white/10"
            aria-label="More"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div
        className={cn(
          "flex-1 overflow-y-auto p-4",
          "bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.03%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')]",
          "bg-chat-pane"
        )}
      >
        <div className="flex flex-col gap-3 max-w-2xl mx-auto">
          {messages.map((msg, i) => (
            <MessageBubble
              key={`${msg.sender}-${msg.receiver}-${msg.timestamp}-${i}`}
              content={msg.content}
              isSent={msg.sender === currentUser}
              timestamp={msg.timestamp}
            />
          ))}
        </div>
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <ChatInput onSend={handleSend} />
    </div>
  );
}
