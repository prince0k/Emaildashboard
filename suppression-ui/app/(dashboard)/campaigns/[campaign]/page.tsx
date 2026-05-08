"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import api from "@/lib/api";

export default function CampaignDetailPage() {
  const params = useParams();
  const campaign =
    typeof params.campaign === "string"
      ? decodeURIComponent(params.campaign)
      : "";

  const [data, setData] = useState<any>(null);
  const [live, setLive] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadAnalytics() {
  try {
    const res = await api.get(
      `/campaigns/${encodeURIComponent(campaign)}/analytics`
    );

    setData(res.data);
  } catch (err: any) {
    console.error("API error:", err);
    setError(
      err?.response?.status
        ? `API error ${err.response.status}`
        : "Network error"
    );
  } finally {
    setLoading(false);
  }
}

async function loadLive() {
  try {
    const res = await fetch(
      `/api/campaigns/live-status?runtimeOfferId=${encodeURIComponent(campaign)}`
    );

    const json = await res.json();
    setLive(json.live || {});
  } catch (err) {
    console.error("Live status error:", err);
  }
}

  useEffect(() => {
  if (!campaign) return;

  loadAnalytics();
  loadLive();

  const interval = setInterval(() => {
    loadLive();
  }, 2000); // 🔥 every 2 sec

  return () => clearInterval(interval);
}, [campaign]);

  if (loading)
    return <div className="p-8 text-muted-foreground text-sm">Loading analytics...</div>;

  if (error)
    return <div className="p-8 text-red-400 text-sm">{error}</div>;

  if (!data)
    return (
      <div className="p-8 text-red-400 text-sm">
        No analytics data available
      </div>
    );

  const sending = data?.sending || {};
  const tracking = data?.tracking || {};
  const meta = data?.meta || {};

  return (
    <div className="space-y-10 max-w-6xl mx-auto">
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">
          {campaign}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Status: {meta.status || "—"}
        </p>
      </div>

      <div>
        <h2 className="text-sm text-muted-foreground mb-3">Live Sending</h2>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          <StatBox label="Live Sent" value={live?.sent ?? 0} />
          <StatBox label="Remaining" value={live?.remaining ?? 0} />
          <StatBox label="Data Left" value={live?.remainingData ?? 0} />
          <StatBox label="Speed/sec" value={live?.speed ?? 0} />
          <StatBox label="Progress %" value={`${live?.progress ?? 0}%`} />
        </div>
      </div>

      {/* SENDING */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <StatBox label="Total Sent" value={sending.totalSent || 0} />
        <StatBox label="Delivered" value={sending.delivered || 0} />
        <StatBox label="Delivery %" value={`${sending.deliveryRate || 0}%`} />
      </div>

      {/* UNIQUE (Lifetime) */}
      <div>
        <h2 className="text-sm text-muted-foreground mb-3">Unique (Lifetime)</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <StatBox label="Unique Opens" value={tracking.uniqueOpens || 0} />
          <StatBox label="Unique Clicks" value={tracking.uniqueClicks || 0} />
          <StatBox label="Open Rate" value={`${tracking.openRate || 0}%`} />
          <StatBox label="Click Rate" value={`${tracking.clickRate || 0}%`} />
          <StatBox label="CTR" value={`${tracking.ctr || 0}%`} />
        </div>
      </div>

      {/* PER-DAY UNIQUE */}
      <div>
        <h2 className="text-sm text-muted-foreground mb-3">Per-Day Unique</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <StatBox label="Total Opens" value={tracking.totalOpens || 0} />
          <StatBox label="Total Clicks" value={tracking.totalClicks || 0} />
        </div>
      </div>

      {/* NEGATIVE SIGNALS */}
      <div>
        <h2 className="text-sm text-muted-foreground mb-3">Negative Signals</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <StatBox label="Optouts" value={tracking.optouts || 0} />
          <StatBox label="Unsubs" value={tracking.unsubs || 0} />
          <StatBox label="Complaints" value={tracking.complaints || 0} />
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value }: any) {
  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-xl font-semibold mt-1 text-foreground">{value}</div>
    </div>
  );
}