"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import api from "@/lib/api";  
import { Shield, ArrowRight, Send, Eye, MousePointer2, AlertCircle } from "lucide-react";
import { useAuth } from "@/lib/authContext";
import { cn } from "@/lib/utils";

type Health = {
  status: "ok" | "down";
  uptime?: number;
  version?: string;
};

type DashboardStats = {
  totalCampaigns: number;
  running: number;
  paused: number;
  scheduled: number;
  completed: number;
  totalSent: number;
  totalDelivered: number;
};

export default function HomePage() {
  const { user, hasPermission, loading } = useAuth();
  const [health, setHealth] = useState<Health | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [pendingRequests, setPendingRequests] = useState(0);

  const isAdmin = user && (hasPermission("*") || hasPermission("role.view"));

  useEffect(() => {
    let cancelled = false;

    async function loadHealth() {
      try {
        const res = await api.get("/health");
        if (!cancelled) {
          setHealth({
            status: String(res.data.status).toLowerCase() === "ok" ? "ok" : "down",
            uptime: res.data.uptime,
            version: res.data.version,
          });
        }
      } catch {
        if (!cancelled) setHealth({ status: "down" });
      }
    }

    async function loadStats() {
      if (!hasPermission("campaign.view")) return;
      try {
        const res = await api.get<DashboardStats>("/campaigns/analytics");
        setStats(res.data);
      } catch (err) {
        console.error("Stats load failed:", err);
      }
    }

    async function loadRequests() {
      if (!isAdmin) return;
      try {
        const res = await api.get("/permission-requests/list?status=PENDING");
        setPendingRequests(res.data.requests?.length || 0);
      } catch (err) {
        console.error("Requests load failed:", err);
      }
    }

    if (loading) return;
    Promise.all([loadHealth(), loadStats(), loadRequests()]);

    const interval = setInterval(() => {
      loadStats();
      loadRequests();
    }, 8000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [isAdmin, hasPermission, loading]);

  const kpis = [
    { label: "Total Sent", value: stats?.totalSent ? `${(stats.totalSent / 1000000).toFixed(1)}M` : "0M", delta: "+12.4%", icon: Send, color: "var(--accent-indigo)", up: true },
    { label: "Total Delivered", value: stats?.totalDelivered ? `${(stats.totalDelivered / 1000000).toFixed(1)}M` : "0M", delta: "+15.2%", icon: Eye, color: "var(--accent-cyan)", up: true },
    { label: "Active Campaigns", value: stats?.running || "0", delta: "Live", icon: MousePointer2, color: "var(--accent-emerald)", up: true },
    { label: "Pending Requests", value: pendingRequests, delta: "Requires Action", icon: Shield, color: pendingRequests > 0 ? "var(--accent-amber)" : "var(--accent-indigo)", up: pendingRequests > 0 },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* KPI STRIP */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpis.map((kpi, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ y: -2 }}
            className="group relative bg-surface border border-border rounded-xl p-4 overflow-hidden transition-all duration-300 hover:border-border-bright hover:shadow-[0_8px_24px_rgba(0,0,0,0.4),inset_0_0_10px_var(--kpi-color)]"
            style={{ "--kpi-color": kpi.color } as any}
          >
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[var(--kpi-color)] to-transparent opacity-50" />
            
            <div className="flex justify-between items-start mb-2">
              <span className="font-mono text-[11px] text-text-muted uppercase tracking-wider">
                {kpi.label}
              </span>
              <kpi.icon size={14} style={{ color: kpi.color }} />
            </div>

            <div className="text-3xl font-extrabold tracking-tighter mb-1 transition-transform group-hover:scale-[1.04] group-hover:text-white">
              {kpi.value}
            </div>

            <div className={cn("text-[10px] font-bold flex items-center gap-1", kpi.up ? "text-emerald" : "text-text-muted")}>
              {kpi.delta}
            </div>

            <div className="h-8 mt-3">
              <svg viewBox="0 0 100 32" preserveAspectRatio="none" className="w-full h-full">
                <defs>
                  <linearGradient id={`grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={kpi.color} stopOpacity="0.3" />
                    <stop offset="100%" stopColor={kpi.color} stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d="M0 30 L0 25 L15 28 L30 15 L45 18 L60 8 L75 12 L90 5 L100 8 L100 32 L0 32 Z" fill={`url(#grad-${i})`} />
                <polyline points="0,25 15,28 30,15 45,18 60,8 75,12 90,5 100,8" fill="none" stroke={kpi.color} strokeWidth="2" />
              </svg>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* MAIN OPERATIONS */}
        <div className="lg:col-span-2 space-y-6">
          <Section title="Active Operations">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {hasPermission("campaign.create") && (
                <ActionCard
                  title="Create Campaign"
                  desc="Build sender → offer → template → send"
                  href="/campaigns/create"
                  primary
                />
              )}
              {hasPermission("deploy.run") && (
                <ActionCard
                  title="Deploy Offer"
                  desc="Activate offer for tracking"
                  href="/deploy"
                />
              )}
              {hasPermission("suppression.view") && (
                <ActionCard
                  title="Run Suppression"
                  desc="Process bounce & complaint lists"
                  href="/suppression"
                />
              )}
              {hasPermission("campaign.view") && (
                <ActionCard
                  title="Campaign Manager"
                  desc="Control pause / resume / stop"
                  href="/campaigns"
                />
              )}
            </div>
          </Section>

          {isAdmin && pendingRequests > 0 && (
            <Link 
              href="/admin/requests"
              className="flex items-center justify-between p-5 rounded-xl bg-amber/5 border border-amber/20 hover:bg-amber/10 transition-all group shadow-2xl"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-amber/10 flex items-center justify-center text-amber">
                  <Shield size={20} />
                </div>
                <div>
                  <div className="font-bold text-sm">Pending Access Requests</div>
                  <div className="text-xs text-text-muted mt-0.5">You have {pendingRequests} request(s) waiting for review.</div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-bold text-amber uppercase tracking-widest group-hover:gap-3 transition-all">
                Review Now
                <ArrowRight size={14} />
              </div>
            </Link>
          )}
        </div>

        {/* SYSTEM HEALTH & FEED */}
        <div className="space-y-6">
          <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-2xl">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <div className="text-sm font-bold">System Integrity</div>
              <div className={cn(
                "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                health?.status === "ok" ? "bg-emerald/10 text-emerald" : "bg-rose/10 text-rose"
              )}>
                {health?.status === "ok" ? "Nominal" : "Degraded"}
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex justify-between items-center text-xs">
                <span className="text-text-muted">API Connection</span>
                <span className={health?.status === "ok" ? "text-emerald" : "text-rose"}>
                  {health?.status === "ok" ? "Stable" : "Lost"}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-text-muted">System Uptime</span>
                <span className="text-foreground font-mono">
                  {health?.uptime ? formatUptime(health.uptime) : "—"}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-text-muted">Version</span>
                <span className="text-text-muted font-mono">{health?.version || "4.2.1"}</span>
              </div>
              
              <div className="pt-2 border-t border-border mt-4">
                <div className="text-[10px] text-text-muted uppercase font-bold mb-3 tracking-widest">Recent Activity</div>
                <div className="space-y-3">
                  {[
                    { time: "12:44", msg: "Suppression sync complete", node: "NYC-01" },
                    { time: "11:20", msg: "Offer deployed: Flash Sale", node: "SJC-01" },
                    { time: "09:15", msg: "New campaign: Onboarding v3", node: "FRA-01" },
                  ].map((log, i) => (
                    <div key={i} className="flex gap-2 text-[10px] font-mono">
                      <span className="text-text-muted">{log.time}</span>
                      <span className="text-text-secondary truncate">{log.msg}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

/* ---------------- REUSABLE COMPONENTS ---------------- */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-xs font-bold text-text-muted uppercase tracking-[0.2em] px-1">
        {title}
      </h2>
      {children}
    </section>
  );
}

function ActionCard({
  title,
  desc,
  href,
  primary,
}: {
  title: string;
  desc: string;
  href: string;
  primary?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative overflow-hidden rounded-xl border p-6 transition-all duration-300",
        primary
          ? "border-primary/30 bg-primary/[0.03] hover:border-primary/50"
          : "border-border bg-card/50 backdrop-blur-sm hover:border-border-bright"
      )}
    >
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-sm text-foreground">
          {title}
        </h3>
        {primary && (
          <div className="w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_8px_var(--accent-indigo)]" />
        )}
      </div>

      <p className="mt-2 text-xs text-text-muted leading-relaxed">
        {desc}
      </p>

      <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-primary uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1">
        Initialize <ArrowRight size={12} />
      </div>
    </Link>
  );
}

function formatUptime(seconds: number) {
  const s = Math.floor(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h) return `${h}h ${m}m`;
  return `${m}m`;
}