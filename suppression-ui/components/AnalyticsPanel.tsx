"use client";

import { useEffect, useState } from "react";
import { Loader2, AlertCircle } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function AnalyticsPanel() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchStats() {
    try {
      const res = await fetch(`${API}/api/campaigns/analytics`, {
        credentials: "include",
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("Analytics API error:", res.status, text);
        setError("Failed to load analytics");
        return;
      }

      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error("Network error:", err);
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading)
    return (
      <div className="bg-card/80 backdrop-blur-sm border border-border/60 rounded-2xl shadow-soft p-8 flex items-center gap-3 text-sm text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin text-primary" />
        Loading analytics...
      </div>
    );

  if (error)
    return (
      <div className="bg-card/80 backdrop-blur-sm border border-destructive/40 rounded-2xl shadow-soft p-8 flex items-center gap-3 text-sm text-destructive">
        <AlertCircle className="w-4 h-4" />
        {error}
      </div>
    );

  if (!stats) return null;

  const deliveryRate =
    stats.totalSent > 0
      ? ((stats.totalDelivered / stats.totalSent) * 100).toFixed(2)
      : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
      <StatBox
        label="Total Campaigns"
        value={stats.totalCampaigns || 0}
      />

      <StatBox
        label="Running"
        value={stats.running || 0}
        highlight="success"
      />

      <StatBox
        label="Total Sent"
        value={stats.totalSent || 0}
      />

      <StatBox
        label="Delivered"
        value={stats.totalDelivered || 0}
        sub={`${deliveryRate}% delivery`}
      />
    </div>
  );
}

function StatBox({
  label,
  value,
  highlight,
  sub,
}: {
  label: string;
  value: number | string;
  highlight?: "success" | "danger";
  sub?: string;
}) {
  const highlightStyles = {
    success: "text-emerald-600 dark:text-emerald-400",
    danger: "text-destructive",
  };

  return (
    <div className="bg-card/80 backdrop-blur-sm border border-border/60 rounded-2xl p-6 shadow-soft transition hover:shadow-medium">
      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>

      <div
        className={`text-2xl font-bold mt-3 ${
          highlight ? highlightStyles[highlight] : "text-foreground"
        }`}
      >
        {value}
      </div>

      {sub && (
        <div className="text-xs text-muted-foreground mt-2">
          {sub}
        </div>
      )}
    </div>
  );
}