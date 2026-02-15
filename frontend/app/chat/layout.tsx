"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { username, token } = useAuthStore();

  useEffect(() => {
    if (!username || !token) {
      router.replace("/login");
    }
  }, [username, token, router]);

  return <>{children}</>;
}
