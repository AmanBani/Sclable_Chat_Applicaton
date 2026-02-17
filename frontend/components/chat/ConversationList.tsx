"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Search, LogOut, MessageCircle, RefreshCw } from "lucide-react";
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
  mode: "topbar" | "sidebar";
  username: string;
  token: string;
  conversations: Conversation[];
  selectedUser: string | null;
  onSelect: (user: string) => void;
  onRefresh: () => void;
  search?: string;
  onSearchChange?: (v: string) => void;
  /** Unread count per other user (for WhatsApp-style badges) */
  unreadByUser?: Record<string, number>;
  /** Total unread count (for header badge) */
  totalUnread?: number;
};

function UnreadBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  const display = count > 99 ? "99+" : String(count);
  return (
    <span
      className="min-w-[20px] h-5 px-1.5 rounded-full bg-[#25D366] text-white text-xs font-bold flex items-center justify-center shrink-0"
      aria-label={`${count} new messages`}
    >
      {display}
    </span>
  );
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function ConversationList({
  mode,
  username,
  token,
  conversations,
  selectedUser,
  onSelect,
  onRefresh,
  search = "",
  onSearchChange = () => {},
  unreadByUser = {},
  totalUnread = 0,
}: Props) {
  const [showNewChat, setShowNewChat] = useState(false);
  const [newChatUser, setNewChatUser] = useState("");
  const [allUsers, setAllUsers] = useState<UserItem[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const router = useRouter();
  const { logout } = useAuthStore();

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

  if (mode === "topbar") {
    return (
      <>
        <div className="shrink-0 flex items-center gap-2 px-4 py-2 border border-white/25 rounded bg-black">
          <span className="font-bold text-white">Chat</span>
          <UnreadBadge count={totalUnread} />
        </div>
        <div className="flex-1 min-w-0 flex items-center gap-2 px-3 py-2 border border-white/25 rounded bg-black">
          <Search className="w-4 h-4 text-white shrink-0" aria-hidden />
          <input
            type="text"
            placeholder="Search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="flex-1 min-w-0 bg-transparent text-white placeholder:text-white/60 outline-none"
          />
        </div>
        <div
          className="shrink-0 w-10 h-10 rounded-full border border-white/25 flex items-center justify-center text-white font-bold text-sm bg-black"
          title={username}
        >
          {getInitials(username)}
        </div>
      </>
    );
  }

  return (
    <>
      <div className="p-3 border-b border-white/25">
        <p className="text-xs font-bold text-white uppercase tracking-wide mb-2">Menu</p>
        <div className="flex flex-col gap-1">
          <button
            type="button"
            onClick={() => setShowNewChat(true)}
            className="flex items-center gap-2 w-full px-3 py-2 text-left text-white border border-white/25 rounded hover:bg-white/5 transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            <span>New chat</span>
          </button>
          <button
            type="button"
            onClick={onRefresh}
            className="flex items-center gap-2 w-full px-3 py-2 text-left text-white border border-white/25 rounded hover:bg-white/5 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 text-left text-white border border-white/25 rounded hover:bg-white/5 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Log out</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 p-2">
        <p className="text-xs font-bold text-white uppercase tracking-wide mb-2 px-1">Conversations</p>
        <div className="flex flex-col gap-1">
          <AnimatePresence mode="popLayout">
            {conversations.map((conv, i) => (
              <motion.div
                key={conv.otherUser}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -6 }}
                transition={{ delay: i * 0.02 }}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 cursor-pointer border rounded transition-colors",
                  selectedUser === conv.otherUser
                    ? "border-white/40 bg-white/10"
                    : "border-white/25 hover:bg-white/5"
                )}
                onClick={() => onSelect(conv.otherUser)}
              >
                <div className="w-9 h-9 rounded-full border border-white/25 flex items-center justify-center text-white font-bold text-xs shrink-0">
                  {getInitials(conv.otherUser)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white text-sm truncate">{conv.otherUser}</p>
                  <p className="text-white/80 text-xs truncate">{conv.lastMessage || "No messages yet"}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <UnreadBadge count={unreadByUser[conv.otherUser] ?? 0} />
                  <span className="text-white/70 text-xs">{conv.lastTime}</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {showNewChat && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 border border-white/25"
            onClick={() => setShowNewChat(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md max-h-[80vh] flex flex-col rounded border border-white/25 bg-black overflow-hidden"
            >
              <div className="p-4 border-b border-white/25">
                <h3 className="font-bold text-white mb-1">New chat</h3>
                <p className="text-white/80 text-sm mb-3">Select a user to start a conversation</p>
                <input
                  type="text"
                  placeholder="Search by username..."
                  value={newChatUser}
                  onChange={(e) => setNewChatUser(e.target.value)}
                  className="w-full px-3 py-2 rounded border border-white/25 bg-black text-white placeholder:text-white/50 outline-none"
                />
              </div>
              <div className="flex-1 overflow-y-auto">
                {loadingUsers ? (
                  <p className="p-4 text-white/80 text-sm">Loading users...</p>
                ) : filteredUsers.length === 0 ? (
                  <p className="p-4 text-white/80 text-sm">
                    {allUsers.length === 0
                      ? "No other users yet. Share the app link for others to register!"
                      : "No users match your search"}
                  </p>
                ) : (
                  filteredUsers.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      className="flex items-center gap-3 w-full px-4 py-3 text-left border-b border-white/25 hover:bg-white/5 transition-colors"
                      onClick={() => handleSelectUser(u.username)}
                    >
                      <div className="w-9 h-9 rounded-full border border-white/25 flex items-center justify-center text-white font-bold text-xs shrink-0">
                        {getInitials(u.username)}
                      </div>
                      <span className="font-bold text-white">{u.username}</span>
                    </button>
                  ))
                )}
              </div>
              <div className="p-4 border-t border-white/25">
                <button
                  type="button"
                  onClick={() => setShowNewChat(false)}
                  className="w-full py-2 rounded border border-white/25 text-white font-medium hover:bg-white/10 transition-colors"
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
