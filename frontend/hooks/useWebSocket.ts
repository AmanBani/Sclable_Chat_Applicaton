"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { WS_URL } from "@/lib/constants";

export type IncomingMessage = {
  sender: string;
  receiver: string;
  content: string;
};

type UseWebSocketOptions = {
  /** Called when a new message is received (for unread badges, etc.) */
  onIncomingMessage?: (msg: IncomingMessage) => void;
};

export function useWebSocket(username: string | null, options?: UseWebSocketOptions) {
  const [messages, setMessages] = useState<IncomingMessage[]>([]);
  const [status, setStatus] = useState<"connecting" | "connected" | "disconnected">("disconnected");
  const wsRef = useRef<WebSocket | null>(null);
  const onIncomingRef = useRef(options?.onIncomingMessage);
  onIncomingRef.current = options?.onIncomingMessage;
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const parsePayload = useCallback((text: string): IncomingMessage | null => {
    const match = text.match(/^(.+?)\s*->\s*(.+?):\s*([\s\S]*)$/);
    if (match) {
      return { sender: match[1].trim(), receiver: match[2].trim(), content: match[3].trim() };
    }
    return null;
  }, []);

  useEffect(() => {
    if (!username) return;

    let isActive = true;

    const clearReconnectTimeout = () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };

    const connect = () => {
      if (!isActive) return;

      setStatus("connecting");
      const url = `${WS_URL}/ws/user/${encodeURIComponent(username)}`;
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        reconnectAttemptsRef.current = 0;
        setStatus("connected");
      };

      const scheduleReconnect = () => {
        if (!isActive) return;
        if (reconnectTimeoutRef.current) return; // already scheduled

        reconnectAttemptsRef.current += 1;
        const delay = Math.min(10000, 1000 * reconnectAttemptsRef.current);
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectTimeoutRef.current = null;
          connect();
        }, delay);
      };

      ws.onclose = () => {
        setStatus("disconnected");
        scheduleReconnect();
      };

      ws.onerror = () => {
        setStatus("disconnected");
        scheduleReconnect();
      };

      ws.onmessage = (event) => {
        const parsed = parsePayload(event.data);
        if (parsed) {
          setMessages((prev) => [...prev, parsed]);
          onIncomingRef.current?.(parsed);
        }
      };
    };

    connect();

    return () => {
      isActive = false;
      clearReconnectTimeout();
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      setStatus("disconnected");
    };
  }, [username, parsePayload]);

  const clearMessages = useCallback(() => setMessages([]), []);

  const addIncoming = useCallback((msg: IncomingMessage) => {
    setMessages((prev) => [...prev, msg]);
  }, []);

  return { messages, status, addIncoming, clearMessages };
}
