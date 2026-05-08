"use client";

import { useState } from "react";
import { Pause, Play, Square, Info, Loader2 } from "lucide-react";

export default function CampaignControls({
  campaign,
  refresh,
}: {
  campaign: any;
  refresh: () => void;
}) {
  const [loading, setLoading] = useState<string | null>(null);

  async function updateStatus(action: string) {
    try {
      setLoading(action);

      const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/campaigns/${encodeURIComponent(
        campaign.campaignName
      )}/control`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action }),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      console.error("Control API failed:", data);
      alert(data.error || "Control failed");
      return;
    }

      refresh();
    } catch (err) {
      console.error("Status update failed", err);
    } finally {
      setLoading(null);
    }
  }

  const ActionButton = ({
    label,
    action,
    icon: Icon,
    variant,
  }: {
    label: string;
    action: string;
    icon: React.ElementType;
    variant: "success" | "warning" | "danger";
  }) => {
    const isLoading = loading === action;

    const variantClasses = {
      success:
        "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20",
      warning:
        "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 hover:bg-amber-500/20",
      danger:
        "bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20",
    };

    return (
      <button
        onClick={() => updateStatus(action)}
        disabled={loading !== null}
        className={`
          inline-flex items-center gap-1.5
          px-3 py-1.5
          text-xs font-semibold
          rounded-xl
          border
          transition-all duration-200
          disabled:opacity-50 disabled:cursor-not-allowed
          focus:outline-none focus:ring-2 focus:ring-primary/30
          ${variantClasses[variant]}
        `}
        title={label}
      >
        {isLoading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Icon className="w-3.5 h-3.5" />
        )}
        <span>{isLoading ? "Processing" : label}</span>
      </button>
    );
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {campaign.status === "RUNNING" && (
        <ActionButton
          label="Pause"
          action="PAUSE"
          icon={Pause}
          variant="warning"
        />
      )}

      {campaign.status === "PAUSED" && (
        <ActionButton
          label="Resume"
          action="RESUME"
          icon={Play}
          variant="success"
        />
      )}

      {["RUNNING", "PAUSED"].includes(campaign.status) && (
        <ActionButton
          label="Stop"
          action="STOP"
          icon={Square}
          variant="danger"
        />
      )}

      {["COMPLETED", "FAILED", "STOPPED"].includes(campaign.status) && (
        <span
          className="
            inline-flex items-center gap-1.5
            px-3 py-1.5
            text-xs font-semibold
            rounded-xl
            border border-border/60
            bg-muted
            text-muted-foreground
          "
        >
          <Info className="w-3.5 h-3.5" />
          No Actions
        </span>
      )}
    </div>
  );
}