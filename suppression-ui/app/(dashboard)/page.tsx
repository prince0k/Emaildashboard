"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import api from "@/lib/api";  

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
  const [health, setHealth] = useState<Health | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  /* ---------------- HEALTH CHECK ---------------- */
  useEffect(() => {
    let cancelled = false;

    async function loadHealth() {
  try {
    const res = await api.get("/health");

    const data = res.data;

    if (!cancelled) {
      setHealth({
        status:
          String(data.status).toLowerCase() === "ok"
            ? "ok"
            : "down",
        uptime: data.uptime,
        version: data.version,
      });
    }
  } catch {
    if (!cancelled) {
      setHealth({ status: "down" });
    }
  }
}

    async function loadStats() {
      try {
        const res = await api.get<DashboardStats>("/campaigns/analytics");
        setStats(res.data);
      } catch (err) {
        console.error("Stats load failed:", err);
      }
    }

    loadHealth();
    loadStats();

    const interval = setInterval(loadStats, 8000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const isOnline = health?.status === "ok";

  return (
    <div className="space-y-12">
      {/* HEADER */}
      <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/80 backdrop-blur-xl p-10 shadow-soft">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.2),transparent_40%)] dark:opacity-20 dark:bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.4),transparent_40%)]" />
        
        <div className="relative flex items-start justify-between">
          <div className="space-y-3">
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
              MMS Internal
            </h1>
            <p className="text-muted-foreground max-w-2xl text-sm">
              Live sending engine, tracking, suppression and offer deployment —
              centralized & monitored in real-time.
            </p>
          </div>
        </div>
      </div>

      {/* SYSTEM STATUS */}
      <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-card/80 backdrop-blur-sm p-6 shadow-soft">
        <div className="flex items-center gap-3">
          <StatusDot ok={isOnline} />
          <div className="text-sm">
            <div className="font-medium text-gray-900 dark:text-gray-100">
              Backend API {isOnline ? "Online" : "Offline"}
            </div>
            {health?.uptime && (
              <div className="text-gray-500 dark:text-gray-400">
                Uptime: {formatUptime(health.uptime)}
              </div>
            )}
          </div>
        </div>

        <div className="text-xs text-gray-500 dark:text-gray-400 text-right">
          Version {health?.version || "—"}
        </div>
      </div>

      {/* QUICK STATS */}
      {stats && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <StatBox label="Total" value={stats.totalCampaigns} />
            <StatBox label="Running" value={stats.running} green />
            <StatBox label="Paused" value={stats.paused} yellow />
            <StatBox label="Scheduled" value={stats.scheduled} blue />
            <StatBox label="Sent" value={stats.totalSent} />
            <StatBox label="Delivered" value={stats.totalDelivered} />
          </div>

          {stats.running > 0 && (
            <div className="flex items-center justify-between rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950 px-4 py-3 text-sm text-green-700 dark:text-green-300 mt-4">
              <div>
                {stats.running} campaign(s) currently sending live
              </div>
              <span className="animate-pulse w-2 h-2 rounded-full bg-green-500 dark:bg-green-400" />
            </div>
          )}
        </>
      )}

      {/* CAMPAIGNS */}
      <Section title="Campaigns & Sending">
        <Grid>
          <ActionCard
            title="Create Campaign"
            desc="Build sender → offer → template → send"
            href="/campaigns/create"
            primary
          />
          <ActionCard
            title="Campaign Manager"
            desc="Control pause / resume / stop"
            href="/campaigns"
          />
          <ActionCard
            title="Sending Logs"
            desc="Inspect job failures & activity"
            href="/campaigns/logs"
          />
        </Grid>
      </Section>

      {/* OPERATIONS */}
      <Section title="Core Operations">
        <Grid cols={4}>
          <ActionCard
            title="Deploy Offer"
            desc="Activate offer for tracking"
            href="/deploy"
          />
          <ActionCard
            title="Offers"
            desc="Offer configurations"
            href="/offers"
          />
          <ActionCard
            title="Suppression"
            desc="Bounce & complaint lists"
            href="/suppression"
          />
          <ActionCard
            title="MD5 Sync"
            desc="Sync hashed lists"
            href="/suppression/md5"
          />
        </Grid>
      </Section>

      {/* FOOTER NOTE */}
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-xs text-yellow-800 dark:text-yellow-200">
        ⚠ Deploy an offer before sending traffic.
        <div className="text-yellow-600 dark:text-yellow-400 mt-1">
          Tracking rejects inactive offers automatically.
        </div>
      </div>
    </div>
  );
}

/* ---------------- REUSABLE COMPONENTS ---------------- */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-5">
      <h2 className="text-lg font-semibold text-foreground border-b border-border/60 pb-2">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Grid({ children, cols = 3 }: { children: React.ReactNode; cols?: number }) {
  const colMap: Record<number, string> = {
    2: "md:grid-cols-2",
    3: "md:grid-cols-3",
    4: "md:grid-cols-4",
    5: "md:grid-cols-5",
    6: "md:grid-cols-6",
  };

  return (
    <div className={`grid grid-cols-1 ${colMap[cols] || "md:grid-cols-3"} gap-6`}>
      {children}
    </div>
  );
}

function StatBox({
  label,
  value,
  green,
  yellow,
  blue,
}: {
  label: string;
  value: number;
  green?: boolean;
  yellow?: boolean;
  blue?: boolean;
}) {
  let color = "text-foreground";

  if (green) color = "text-emerald-600 dark:text-emerald-400";
  if (yellow) color = "text-muted-foreground";
  if (blue) color = "text-primary";

  return (
    <div className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-sm p-5 shadow-soft transition hover:shadow-medium">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className={`mt-3 text-2xl font-bold ${color}`}>
        {value}
      </div>
    </div>
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
      className={`
        group relative overflow-hidden rounded-2xl border p-6 transition duration-300
        ${
          primary
            ? "border-primary/30 bg-primary/5"
            : "border-border/60 bg-card/80 backdrop-blur-sm"
        }
        hover:-translate-y-1 hover:shadow-medium
      `}
    >
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm text-foreground">
          {title}
        </h3>

        {primary && (
          <span className="text-[10px] px-2 py-0.5 rounded bg-primary text-primary-foreground">
            PRIMARY
          </span>
        )}
      </div>

      <p className="mt-3 text-sm text-muted-foreground">
        {desc}
      </p>

      <div className="mt-5 text-sm font-medium text-primary group-hover:translate-x-1 transition">
        Open →
      </div>
    </Link>
  );
}

function StatusDot({ ok }: { ok: boolean }) {
  return (
    <span
      className={`inline-block w-2.5 h-2.5 rounded-full ${
        ok ? "bg-emerald-500" : "bg-destructive"
      }`}
    />
  );
}

function formatUptime(seconds: number) {
  const s = Math.floor(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;

  if (h) return `${h}h ${m}m`;
  if (m) return `${m}m ${sec}s`;
  return `${sec}s`;
}