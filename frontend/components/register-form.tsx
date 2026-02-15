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
import { register } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import Link from "next/link";

export function RegisterForm({
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
      await register(username, password);
      const res = await import("@/lib/api").then((m) =>
        m.login(username, password)
      );
      setAuth(username, res.access_token);
      router.push("/chat");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden border border-white/30 shadow-xl bg-chat-sidebar rounded-xl">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form onSubmit={handleSubmit} className="p-6 md:p-8 border-b md:border-b-0 md:border-r border-white/20">
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center pb-4 border-b border-white/20 mb-6">
                <h1 className="text-2xl font-bold text-white">Create account</h1>
                <p className="text-chat-muted">
                  Choose a username and password to get started
                </p>
              </div>
              <Field>
                <FieldLabel htmlFor="username" className="text-white/90">
                  Username
                </FieldLabel>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Choose a username"
                  required
                  className="bg-white/5 border border-white/30 text-white placeholder:text-white/50 rounded-lg focus:border-white/60"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="password" className="text-white/90">
                  Password
                </FieldLabel>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={4}
                  className="bg-white/5 border border-white/30 text-white placeholder:text-white/50 rounded-lg focus:border-white/60"
                />
              </Field>
              {error && (
                <p className="text-sm text-red-400">{error}</p>
              )}
              <Field>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-chat-accent hover:bg-chat-accent/90 text-white border border-white/30"
                >
                  {loading ? "Creating account..." : "Create account"}
                </Button>
              </Field>
              <FieldDescription className="text-center text-chat-muted">
                Already have an account?{" "}
                <Link href="/login" className="text-chat-accent hover:underline">
                  Sign in
                </Link>
              </FieldDescription>
            </FieldGroup>
          </form>
          <div className="hidden md:block bg-chat-accent/20 p-8 flex items-center justify-center border-l border-white/20">
            <p className="text-white/80 text-center text-lg">
              Join the conversation
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
