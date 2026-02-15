"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Plus,
  LogOut,
  MessageCircle,
  RefreshCw,
} from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { listUsers } from "@/lib/api";
import { cn } from "@/lib/utils";

type UserItem = { id: number; username: string };

export type Conversation = {
  otherUser: string;
  lastMessage: string;
  lastTime: string;
};

type Props = {
  username: string;
  token: string;
  conversations: Conversation[];
  selectedUser: string | null;
  onSelect: (user: string) => void;
  onRefresh: () => void;
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function ConversationList({
  username,
  token,
  conversations,
  selectedUser,
  onSelect,
  onRefresh,
}: Props) {
  const [search, setSearch] = useState("");
  const [showNewChat, setShowNewChat] = useState(false);
  const [newChatUser, setNewChatUser] = useState("");
  const [allUsers, setAllUsers] = useState<UserItem[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const router = useRouter();
  const { logout } = useAuthStore();

  const filtered = conversations.filter((c) =>
    c.otherUser.toLowerCase().includes(search.toLowerCase())
  );

  const filteredUsers = allUsers.filter(
    (u) =>
      u.username.toLowerCase().includes(newChatUser.toLowerCase()) &&
      u.username !== username
  );

  useEffect(() => {
    if (showNewChat && token) {
      setLoadingUsers(true);
      listUsers(token, username)
        .then(setAllUsers)
        .catch(() => setAllUsers([]))
        .finally(() => setLoadingUsers(false));
    }
  }, [showNewChat, token, username]);

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  const handleSelectUser = (u: string) => {
    onSelect(u);
    setShowNewChat(false);
    setNewChatUser("");
  };

  return (
    <>
      {/* Header - WhatsApp style */}
      <div className="h-16 px-4 flex items-center justify-between bg-chat-sidebar-header shrink-0 border-b border-white/20">
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-full bg-chat-accent flex items-center justify-center text-white font-semibold text-sm">
            {getInitials(username)}
          </div>
          <span className="text-white font-medium truncate max-w-[120px]">
            {username}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowNewChat(true)}
            className="p-2 rounded-full text-white/80 hover:bg-white/10"
            aria-label="New chat"
          >
            <MessageCircle className="w-5 h-5" />
          </button>
          <button
            onClick={onRefresh}
            className="p-2 rounded-full text-white/80 hover:bg-white/10"
            aria-label="Refresh"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button
            onClick={handleLogout}
            className="p-2 rounded-full text-white/80 hover:bg-white/10"
            aria-label="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Search bar */}
      <div className="px-3 py-2 bg-chat-sidebar shrink-0 border-b border-white/10">
        <div className="flex items-center gap-2 bg-chat-search-bg rounded-lg px-3 py-2 border border-white/20">
          <Search className="w-4 h-4 text-chat-muted shrink-0" />
          <input
            type="text"
            placeholder="Search or start new chat"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm text-white placeholder:text-chat-muted outline-none"
          />
        </div>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="popLayout">
          {filtered.map((conv, i) => (
            <motion.div
              key={conv.otherUser}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ delay: i * 0.02 }}
              whileHover={{ backgroundColor: "rgba(255,255,255,0.05)" }}
              className={cn(
                "flex items-center gap-3 px-4 py-3 cursor-pointer border-b border-white/10",
                selectedUser === conv.otherUser && "bg-white/10 border-l-2 border-l-white/50"
              )}
              onClick={() => onSelect(conv.otherUser)}
            >
              <div className="w-12 h-12 rounded-full bg-chat-accent/80 flex items-center justify-center text-white font-semibold text-sm shrink-0">
                {getInitials(conv.otherUser)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">
                  {conv.otherUser}
                </p>
                <p className="text-chat-muted text-sm truncate">
                  {conv.lastMessage || "No messages yet"}
                </p>
              </div>
              <span className="text-chat-muted text-xs shrink-0">
                {conv.lastTime}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* New chat modal - User list like WhatsApp */}
      <AnimatePresence>
        {showNewChat && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
            onClick={() => setShowNewChat(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-chat-sidebar rounded-xl w-full max-w-md max-h-[80vh] flex flex-col border border-white/30 overflow-hidden"
            >
              <div className="p-4 border-b border-white/20 shrink-0">
                <h3 className="text-white font-semibold mb-3">New chat</h3>
                <p className="text-chat-muted text-sm mb-3">
                  Select a user to start a conversation
                </p>
                <input
                  type="text"
                  placeholder="Search by username..."
                  value={newChatUser}
                  onChange={(e) => setNewChatUser(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/30 text-white placeholder:text-chat-muted outline-none focus:ring-2 focus:ring-chat-accent focus:border-white/50"
                />
              </div>
              <div className="flex-1 overflow-y-auto">
                {loadingUsers ? (
                  <p className="p-4 text-chat-muted text-sm">Loading users...</p>
                ) : filteredUsers.length === 0 ? (
                  <p className="p-4 text-chat-muted text-sm">
                    {allUsers.length === 0
                      ? "No other users yet. Share the app link for others to register!"
                      : "No users match your search"}
                  </p>
                ) : (
                  filteredUsers.map((u) => (
                    <motion.div
                      key={u.id}
                      whileHover={{ backgroundColor: "rgba(255,255,255,0.08)" }}
                      className="flex items-center gap-3 px-4 py-3 cursor-pointer border-b border-white/10"
                      onClick={() => handleSelectUser(u.username)}
                    >
                      <div className="w-10 h-10 rounded-full bg-chat-accent/80 flex items-center justify-center text-white font-semibold text-sm shrink-0">
                        {getInitials(u.username)}
                      </div>
                      <p className="text-white font-medium">{u.username}</p>
                    </motion.div>
                  ))
                )}
              </div>
              <div className="p-4 border-t border-white/20 shrink-0">
                <button
                  onClick={() => setShowNewChat(false)}
                  className="w-full py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 border border-white/20"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
