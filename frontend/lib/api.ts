import { API_URL } from "./constants";

export type Message = {
  sender: string;
  receiver: string;
  content: string;
  status: string;
  timestamp: string;
};

export async function register(username: string, password: string) {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Registration failed");
  }
  return res.json();
}

export async function login(username: string, password: string) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Login failed");
  }
  return res.json();
}

function getAuthHeaders(token: string | null): HeadersInit {
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

export async function getMessages(userId: string, token: string) {
  const res = await fetch(`${API_URL}/chat/messages/${userId}`, {
    headers: getAuthHeaders(token),
  });
  if (!res.ok) throw new Error("Failed to fetch messages");
  return res.json();
}

export async function getConversation(user1: string, user2: string, token: string) {
  const res = await fetch(`${API_URL}/chat/messages/conversation/${user1}/${user2}`, {
    headers: getAuthHeaders(token),
  });
  if (!res.ok) throw new Error("Failed to fetch conversation");
  return res.json();
}

export async function sendMessage(
  sender: string,
  receiver: string,
  content: string,
  token: string
) {
  const res = await fetch(`${API_URL}/chat/messages/send`, {
    method: "POST",
    headers: getAuthHeaders(token),
    body: JSON.stringify({ sender, receiver, content }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to send message");
  }
  return res.json();
}

export async function listUsers(token: string, exclude?: string) {
  const url = exclude
    ? `${API_URL}/user/list/all?exclude=${encodeURIComponent(exclude)}`
    : `${API_URL}/user/list/all`;
  const res = await fetch(url, { headers: getAuthHeaders(token) });
  if (!res.ok) throw new Error("Failed to fetch users");
  return res.json();
}

export async function getUser(username: string, token: string) {
  const res = await fetch(`${API_URL}/user/${username}`, {
    headers: getAuthHeaders(token),
  });
  if (!res.ok) throw new Error("User not found");
  return res.json();
}
