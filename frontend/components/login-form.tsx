"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { login } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import Link from "next/link";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login: setAuth } = useAuthStore();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await login(username, password);
      setAuth(username, res.access_token);
      router.push("/chat");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden border border-white/25 rounded bg-black">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="text-center pb-4 border-b border-white/25 mb-2">
              <h1 className="font-bold text-white text-xl">Welcome back</h1>
              <p className="text-white/80 text-sm mt-1">Sign in to continue chatting</p>
            </div>
            <Field>
              <FieldLabel htmlFor="username" className="font-bold text-white">
                Username
              </FieldLabel>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                required
                className="bg-black border border-white/25 text-white placeholder:text-white/50 rounded focus:border-white/50"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="password" className="font-bold text-white">
                Password
              </FieldLabel>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-black border border-white/25 text-white placeholder:text-white/50 rounded focus:border-white/50"
              />
            </Field>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <Field>
              <Button
                type="submit"
                disabled={loading}
                className="w-full rounded border border-white/25 text-white font-bold hover:bg-white/10 bg-black"
              >
                {loading ? "Signing in..." : "Sign in"}
              </Button>
            </Field>
            <FieldDescription className="text-center text-white/80 text-sm">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="text-white font-bold hover:underline">
                Sign up
              </Link>
            </FieldDescription>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
