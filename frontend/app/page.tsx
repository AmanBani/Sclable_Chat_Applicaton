"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { LoginForm } from "@/components/login-form";

export default function HomePage() {
  const router = useRouter();
  const { username, token } = useAuthStore();

  useEffect(() => {
    if (username && token) {
      router.replace("/chat");
    }
  }, [username, token, router]);

  return (
    <div className="min-h-svh bg-chat-sidebar flex flex-col items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-xl border border-white/20 rounded-2xl p-2">
        <LoginForm />
      </div>
    </div>
  );
}
