"use client";

import { X } from "lucide-react";

export default function MiniAnalytics({
  campaign,
  onClose,
}: {
  campaign: any;
  onClose: () => void;
}) {
  if (!campaign) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="
          relative w-full max-w-lg
          bg-card/90 backdrop-blur-xl
          border border-border/60
          rounded-2xl
          shadow-large
          p-6
          space-y-6
          animate-in fade-in zoom-in-95 duration-200
        "
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3
              className="text-lg font-semibold leading-snug break-all"
              title={campaign.campaignName}
            >
              {campaign.campaignName}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Campaign Performance Snapshot
            </p>
          </div>

          <button
            onClick={onClose}
            className="
              p-2 rounded-xl
              hover:bg-muted/50
              transition
            "
          >
            <X size={16} className="text-muted-foreground" />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <Stat label="Unique Opens" value={campaign.kpi?.uniqueOpens} />
          <Stat label="Total Opens" value={campaign.kpi?.totalOpens} />

          <Stat label="Unique Clicks" value={campaign.kpi?.uniqueClicks} />
          <Stat label="Total Clicks" value={campaign.kpi?.totalClicks} />

          <Stat label="Open Rate" value={`${campaign.kpi?.openRate ?? 0}%`} />
          <Stat label="Click Rate" value={`${campaign.kpi?.clickRate ?? 0}%`} />

          <Stat label="CTR" value={`${campaign.kpi?.ctr ?? 0}%`} />
          <Stat label="Optouts" value={campaign.kpi?.optouts} />

          <Stat label="Unsubs" value={campaign.kpi?.unsubs} />
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: any) {
  return (
    <div
      className="
        bg-muted/40
        border border-border/50
        rounded-xl
        px-4 py-3
        flex flex-col
      "
    >
      <span className="text-xs text-muted-foreground">
        {label}
      </span>
      <span className="mt-1 text-base font-semibold">
        {value ?? 0}
      </span>
    </div>
  );
}