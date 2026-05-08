"use client";

import { useCallback, useEffect, useState } from "react";
import api from "@/lib/api";

type LiveReadyCampaign = {
  _id: string;
  campaignName: string;
  runtimeOfferId?: string;
  senderServerId?: string;
  sender?: {
    name?: string;
  };
  liveExecuted?: boolean;
  suppression?: {
    status?: string;
  };
  sendConfig?: {
    totalSend?: number;
    sendInSeconds?: number;
    sendInMinutes?: number;
    sendInHours?: number;
    trackingMode?: "from" | "domain";
    trackingDomain?: string;
    aliases?: string[];
    seeds?: string[];
    seedAfter?: number;
    seedMode?: "round" | "random";
    contentMode?: "html" | "multipart";
    textEncoding?: "base64" | "quoted-printable" | "7bit";
    htmlEncoding?: "base64" | "quoted-printable" | "7bit";
    subject?: string;
    fromName?: string;
    envelopeMode?: "route" | "random" | "custom";
    envelopeCustomType?: "fixed" | "pattern";
    envelopeCustomEmail?: string;
    envelopeCustomDomain?: string;
    envelopePatternBlocks?: number;
    envelopePatternLength?: number;
    headerMode?: "route" | "random" | "custom";
    headerCustomType?: "fixed" | "pattern";
    headerCustomEmail?: string;
    headerCustomDomain?: string;
    headerPatternBlocks?: number;
    headerPatternLength?: number;
    headerBlockMode?: "default" | "custom";
    customHeaderBlock?: string;
  };
};

export default function LiveReadyCampaignsPage() {
  const [campaigns, setCampaigns] = useState<LiveReadyCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningCampaign, setRunningCampaign] = useState<string | null>(null);

  const fetchLiveReadyCampaigns = useCallback(async () => {
    try {
      const today = new Date();
      const localDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

      const res = await api.get("/campaigns", {
        params: {
          page: 1,
          limit: 200,
          from: localDate,
          to: localDate,
          sortBy: "createdAt",
          order: "desc",
        },
      });

      const rows: LiveReadyCampaign[] = res.data?.data || [];

      setCampaigns(
        rows.filter(
          (campaign) =>
            campaign?.suppression?.status === "COMPLETED" &&
            !campaign?.liveExecuted
        )
      );
    } catch (err) {
      console.error("Live-ready campaigns fetch failed:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLiveReadyCampaigns();
    const interval = setInterval(fetchLiveReadyCampaigns, 8000);
    return () => clearInterval(interval);
  }, [fetchLiveReadyCampaigns]);

  const handleSendLive = async (campaign: LiveReadyCampaign) => {
    const cfg = campaign.sendConfig;

    if (!cfg?.totalSend || cfg.totalSend <= 0) {
      alert("Total Send config missing. Pehle campaign send settings save karo.");
      return;
    }

    const hasThrottle =
      Number(cfg.sendInSeconds || 0) > 0 ||
      Number(cfg.sendInMinutes || 0) > 0 ||
      Number(cfg.sendInHours || 0) > 0;

    if (!hasThrottle) {
      alert("Throttle time missing. Pehle send timing configure karo.");
      return;
    }

    try {
      setRunningCampaign(campaign._id);

      await api.post(`/campaigns/${encodeURIComponent(campaign.campaignName)}/run`, {
        mode: "LIVE",
        totalSend: cfg.totalSend,
        sendInSeconds: cfg.sendInSeconds,
        sendInMinutes: cfg.sendInMinutes,
        sendInHours: cfg.sendInHours,
        trackingMode: cfg.trackingMode,
        trackingDomain: cfg.trackingDomain,
        aliases: cfg.aliases || [],
        seeds: cfg.seeds || [],
        seedAfter: cfg.seedAfter,
        seedMode: cfg.seedMode,
        contentMode: cfg.contentMode,
        textEncoding: cfg.textEncoding,
        htmlEncoding: cfg.htmlEncoding,
        subject: cfg.subject,
        fromName: cfg.fromName,
        envelopeMode: cfg.envelopeMode,
        envelopeCustomType: cfg.envelopeCustomType,
        envelopeCustomEmail: cfg.envelopeCustomEmail,
        envelopeCustomDomain: cfg.envelopeCustomDomain,
        envelopePatternBlocks: cfg.envelopePatternBlocks,
        envelopePatternLength: cfg.envelopePatternLength,
        headerMode: cfg.headerMode,
        headerCustomType: cfg.headerCustomType,
        headerCustomEmail: cfg.headerCustomEmail,
        headerCustomDomain: cfg.headerCustomDomain,
        headerPatternBlocks: cfg.headerPatternBlocks,
        headerPatternLength: cfg.headerPatternLength,
        headerBlockMode: cfg.headerBlockMode,
        customHeaderBlock: cfg.customHeaderBlock,
      });

      await fetchLiveReadyCampaigns();
    } catch (err: any) {
      const message =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "Send live failed";
      alert(message);
    } finally {
      setRunningCampaign(null);
    }
  };

  const getThrottleText = (campaign: LiveReadyCampaign) => {
    const cfg = campaign.sendConfig;
    if (!cfg) return "—";
    if ((cfg.sendInSeconds || 0) > 0) return `${cfg.sendInSeconds}s`;
    if ((cfg.sendInMinutes || 0) > 0) return `${cfg.sendInMinutes}m`;
    if ((cfg.sendInHours || 0) > 0) return `${cfg.sendInHours}h`;
    return "—";
  };

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-sm p-6 shadow-soft">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
          Live Ready Dashboard
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          Aaj ke suppressed campaigns jo live run ke liye ready hain.
        </p>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-sm shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/40 border-b border-border/60">
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3 font-semibold">Server</th>
                <th className="px-4 py-3 font-semibold">Campaign Name</th>
                <th className="px-4 py-3 font-semibold">Offer ID</th>
                <th className="px-4 py-3 font-semibold">Total Send</th>
                <th className="px-4 py-3 font-semibold">Throttle Time</th>
                <th className="px-4 py-3 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    Loading campaigns...
                  </td>
                </tr>
              ) : campaigns.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    Aaj ke liye koi bhi suppressed live-ready campaign nahi mila.
                  </td>
                </tr>
              ) : (
                campaigns.map((campaign) => (
                  <tr key={campaign._id} className="border-b border-border/40 last:border-0">
                    <td className="px-4 py-3">{campaign.senderServerId || campaign.sender?.name || "—"}</td>
                    <td className="px-4 py-3 font-medium">{campaign.campaignName}</td>
                    <td className="px-4 py-3">{campaign.runtimeOfferId || "—"}</td>
                    <td className="px-4 py-3">{campaign.sendConfig?.totalSend || "—"}</td>
                    <td className="px-4 py-3">{getThrottleText(campaign)}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => handleSendLive(campaign)}
                        disabled={runningCampaign === campaign._id}
                        className="inline-flex items-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {runningCampaign === campaign._id ? "Sending..." : "Send Live Campaign"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}