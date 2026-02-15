"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  onSend: (text: string) => void;
  disabled?: boolean;
  placeholder?: string;
};

export function ChatInput({
  onSend,
  disabled,
  placeholder = "Type a message",
}: Props) {
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
  }, [text]);

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText("");
  };

  return (
    <div className="flex items-end gap-2 p-4 bg-chat-pane-header border-t border-white/20">
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
          }
        }}
        placeholder={placeholder}
        disabled={disabled}
        rows={1}
        className={cn(
          "flex-1 resize-none rounded-2xl px-4 py-3 text-sm outline-none",
          "bg-chat-input-bg border border-white/20 text-white placeholder:text-white/50",
          "focus:ring-2 focus:ring-chat-accent/30 focus:border-chat-accent",
          "min-h-[44px] max-h-[120px]"
        )}
      />
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleSubmit}
        disabled={!text.trim() || disabled}
        className={cn(
          "w-12 h-12 rounded-full flex items-center justify-center shrink-0",
          "bg-chat-accent text-white hover:bg-chat-accent-hover border border-white/30",
          "disabled:opacity-50 disabled:cursor-not-allowed"
        )}
        aria-label="Send message"
      >
        <Send className="w-5 h-5" />
      </motion.button>
    </div>
  );
}
