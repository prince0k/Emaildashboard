"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import api from "@/lib/api";
import { cn } from "@/lib/utils";

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
      await api.post("/auth/login", { email, password });
      router.replace(redirectTo);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Authentication failed. Check credentials.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center px-6 relative overflow-hidden bg-background">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full animate-drift" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan/10 blur-[120px] rounded-full animate-drift delay-[-5s]" />
      <div className="absolute inset-0 grid-bg opacity-20 pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand/Logo */}
        <div className="text-center mb-10 flex flex-col items-center">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-cyan rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(99,130,255,0.3)] mb-6">
            <ShieldCheck size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tighter text-foreground mb-2">
            EmailCore
          </h1>
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-text-muted">
            Internal Operations Console
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-surface/60 backdrop-blur-3xl border border-border rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
          
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              login();
            }}
            className="space-y-6"
          >
            {error && (
              <div className="bg-rose/10 border border-rose/20 text-rose text-xs font-bold rounded-xl px-4 py-3 animate-in fade-in zoom-in-95 duration-200">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted px-1">
                Operator Email
              </label>
              <input
                type="email"
                placeholder="operator@emailcore.io"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-panel/50 border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:border-primary outline-none transition-all placeholder:text-text-muted/30"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted px-1">
                Access Key
              </label>
              <input
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-panel/50 border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:border-primary outline-none transition-all placeholder:text-text-muted/30"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={cn(
                "w-full flex items-center justify-center gap-3 py-3.5 rounded-xl text-xs font-bold uppercase tracking-[0.2em] transition-all",
                loading 
                  ? "bg-panel text-text-muted cursor-not-allowed" 
                  : "bg-primary text-white hover:shadow-[0_0_20px_rgba(99,130,255,0.4)] active:scale-[0.98]"
              )}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Authorize Access"
              )}
            </button>
          </form>
        </div>

        <p className="mt-8 text-center text-[10px] text-text-muted uppercase tracking-widest">
          Secure terminal session · encrypted end-to-end
        </p>
      </div>
    </div>
  );
}