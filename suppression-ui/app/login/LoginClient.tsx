"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import api from "@/lib/api";

export default function LoginClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const redirectTo = searchParams.get("redirect") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function login() {
    setLoading(true);
    setError("");

    try {
      await api.post("/auth/login", {
        email,
        password,
      });

      router.replace(redirectTo);
    } catch (err: any) {
      setError(
        err?.response?.data?.message || "Login failed"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/30 px-6">
      <div className="w-full max-w-md">

        {/* Brand */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">
            Operations Console
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Sign in to continue
          </p>
        </div>

        {/* Card */}
        <div className="bg-card/90 backdrop-blur-xl border border-border/60 rounded-2xl shadow-large p-8 space-y-6">

          {error && (
            <div className="bg-destructive/10 border border-destructive/30 text-destructive text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          {/* Email */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Email
            </label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="
                w-full
                bg-background
                border border-border/60
                rounded-xl
                px-4 py-2.5
                text-sm
                focus:outline-none focus:ring-2 focus:ring-primary/40
                transition
              "
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="
                w-full
                bg-background
                border border-border/60
                rounded-xl
                px-4 py-2.5
                text-sm
                focus:outline-none focus:ring-2 focus:ring-primary/40
                transition
              "
            />
          </div>

          {/* Button */}
          <button
            onClick={login}
            disabled={loading}
            className="
              w-full
              inline-flex items-center justify-center gap-2
              bg-primary
              text-primary-foreground
              py-2.5
              rounded-xl
              text-sm font-semibold
              hover:opacity-90
              disabled:opacity-60
              transition
            "
          >
            {loading && (
              <Loader2 className="w-4 h-4 animate-spin" />
            )}
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </div>

      </div>
    </div>
  );
}