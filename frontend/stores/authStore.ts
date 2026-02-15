import { create } from "zustand";
import { persist } from "zustand/middleware";

type AuthState = {
  username: string | null;
  token: string | null;
  login: (username: string, token: string) => void;
  logout: () => void;
  setToken: (token: string) => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      username: null,
      token: null,
      login: (username, token) => set({ username, token }),
      logout: () => set({ username: null, token: null }),
      setToken: (token) => set({ token }),
    }),
    { name: "chat-auth" }
  )
);
