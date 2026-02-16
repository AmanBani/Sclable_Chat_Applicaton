"use client";

import { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";

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
    <div className="shrink-0 p-4 border-t border-white/25 bg-black">
      <div className="flex items-end gap-2 p-2 rounded border border-white/25 bg-black">
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
          className="flex-1 min-w-0 resize-none bg-transparent text-white placeholder:text-white/50 outline-none py-2 px-2 min-h-[40px] max-h-[120px]"
        />
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!text.trim() || disabled}
          className="shrink-0 flex items-center justify-center gap-1.5 px-4 py-2 rounded border border-white/25 text-white font-bold hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Send className="w-4 h-4" />
          <span>Send</span>
        </button>
      </div>
    </div>
  );
}
