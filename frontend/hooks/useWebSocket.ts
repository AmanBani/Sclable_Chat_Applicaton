"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { WS_URL } from "@/lib/constants";

export type IncomingMessage = {
  sender: string;
  receiver: string;
  content: string;
};

export function useWebSocket(username: string | null) {
  const [messages, setMessages] = useState<IncomingMessage[]>([]);
  const [status, setStatus] = useState<"connecting" | "connected" | "disconnected">("disconnected");
  const wsRef = useRef<WebSocket | null>(null);

  const parsePayload = useCallback((text: string): IncomingMessage | null => {
    const match = text.match(/^(.+?)\s*->\s*(.+?):\s*([\s\S]*)$/);
    if (match) {
      return { sender: match[1].trim(), receiver: match[2].trim(), content: match[3].trim() };
    }
    return null;
  }, []);

  useEffect(() => {
    if (!username) return;

    const url = `${WS_URL}/ws/user/${encodeURIComponent(username)}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => setStatus("connected");
    ws.onclose = () => setStatus("disconnected");
    ws.onerror = () => setStatus("disconnected");

    ws.onmessage = (event) => {
      const parsed = parsePayload(event.data);
      if (parsed) setMessages((prev) => [...prev, parsed]);
    };

    return () => {
      ws.close();
      wsRef.current = null;
      setStatus("disconnected");
    };
  }, [username, parsePayload]);

  const clearMessages = useCallback(() => setMessages([]), []);

  const addIncoming = useCallback((msg: IncomingMessage) => {
    setMessages((prev) => [...prev, msg]);
  }, []);

  return { messages, status, addIncoming, clearMessages };
}
