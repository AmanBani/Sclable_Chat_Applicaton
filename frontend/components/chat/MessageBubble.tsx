"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type Props = {
  content: string;
  isSent: boolean;
  timestamp: string;
};

function formatTime(ts: string) {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function MessageBubble({ content, isSent, timestamp }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "flex w-full",
        isSent ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "max-w-[75%] rounded-2xl px-4 py-2 shadow-sm border border-white/20",
          isSent
            ? "rounded-br-md bg-chat-sent text-white"
            : "rounded-bl-md bg-chat-received text-white"
        )}
      >
        <p className="text-sm whitespace-pre-wrap break-words">{content}</p>
        <p
          className={cn(
            "text-[10px] mt-1 text-right",
            "text-white/70"
          )}
        >
          {formatTime(timestamp)}
        </p>
      </div>
    </motion.div>
  );
}
