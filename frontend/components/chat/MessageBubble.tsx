"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type Props = {
  content: string;
  isSent: boolean;
  timestamp: string;
  senderName?: string;
  currentUserName?: string;
  showSeparator?: boolean;
};

function formatTime(ts: string) {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function MessageBubble({
  content,
  isSent,
  timestamp,
  senderName,
  currentUserName,
  showSeparator,
}: Props) {
  const initials = isSent
    ? (currentUserName ? currentUserName.slice(0, 2).toUpperCase() : "Me")
    : (senderName ? senderName.slice(0, 2).toUpperCase() : "??");

  if (isSent) {
    // Your message: right side only, bubble with tail on right (WhatsApp/Telegram style)
    return (
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15 }}
        className={cn("flex w-full justify-end", showSeparator && "mt-3")}
      >
        <div className="flex flex-col items-end max-w-[80%]">
          <div
            className={cn(
              "px-3 py-2 rounded-2xl rounded-br-sm border border-white/30",
              "bg-white/20"
            )}
          >
            <p className="text-white text-sm whitespace-pre-wrap break-words text-left">
              {content}
            </p>
            <p className="text-white/70 text-[10px] mt-1 text-right">
              {formatTime(timestamp)}
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  // Their message: left side with avatar, bubble with tail on left
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      className={cn("flex w-full justify-start gap-2", showSeparator && "mt-3")}
    >
      <div className="w-8 h-8 shrink-0 rounded-full border border-white/25 flex items-center justify-center text-white font-bold text-xs bg-black">
        {initials}
      </div>
      <div className="flex flex-col max-w-[80%] min-w-0">
        <span className="font-bold text-white text-xs mb-0.5">{senderName || "Unknown"}</span>
        <div
          className={cn(
            "px-3 py-2 rounded-2xl rounded-bl-sm border border-white/25",
            "bg-white/10"
          )}
        >
          <p className="text-white text-sm whitespace-pre-wrap break-words">
            {content}
          </p>
          <p className="text-white/60 text-[10px] mt-1 text-right">
            {formatTime(timestamp)}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
