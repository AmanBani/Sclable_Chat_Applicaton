"use client";

import { useEffect, useRef } from "react";
import { Phone, Video, MoreVertical, ArrowLeft } from "lucide-react";
import { MessageBubble } from "./MessageBubble";
import { ChatInput } from "./ChatInput";
import { getConversation, sendMessage } from "@/lib/api";
import type { Message } from "@/lib/api";
import type { IncomingMessage } from "@/hooks/useWebSocket";

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
    <div className="flex flex-col h-full min-h-0 bg-black">
      <div className="shrink-0 flex items-center gap-3 px-4 py-3 border-b border-white/25 bg-black">
        <button
          type="button"
          className="md:hidden p-2 -ml-2 rounded border border-white/25 text-white hover:bg-white/10"
          aria-label="Back"
          onClick={onBack}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="w-9 h-9 rounded-full border border-white/25 flex items-center justify-center text-white font-bold text-xs shrink-0">
          {getInitials(otherUser)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-white truncate">{otherUser}</p>
          <p className="text-white/80 text-xs">Click to view profile</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="p-2 rounded border border-white/25 text-white hover:bg-white/10"
            aria-label="Voice call"
          >
            <Phone className="w-5 h-5" />
          </button>
          <button
            type="button"
            className="p-2 rounded border border-white/25 text-white hover:bg-white/10"
            aria-label="Video call"
          >
            <Video className="w-5 h-5" />
          </button>
          <button
            type="button"
            className="p-2 rounded border border-white/25 text-white hover:bg-white/10"
            aria-label="More"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 bg-black">
        <div className="flex flex-col gap-0.5 max-w-2xl mx-auto w-full">
          {messages.map((msg, i) => {
            const isSent = msg.sender === currentUser;
            const prevSender = i > 0 ? messages[i - 1].sender : null;
            const showSeparator = i > 0 && prevSender !== msg.sender;
            return (
              <MessageBubble
                key={`${msg.sender}-${msg.receiver}-${msg.timestamp}-${i}`}
                content={msg.content}
                isSent={isSent}
                timestamp={msg.timestamp}
                senderName={isSent ? undefined : msg.sender}
                currentUserName={currentUser}
                showSeparator={showSeparator}
              />
            );
          })}
        </div>
        <div ref={bottomRef} />
      </div>

      <ChatInput onSend={handleSend} />
    </div>
  );
}
