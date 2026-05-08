import React from "react";

interface CampaignInfoProps {
  sender: string;
  senderServerId?: string;
  status?: string;
  runtimeOfferId?: string;
  suppression?: {
    inputCount: number;
    finalCount: number;
    removedCount: number;
  };
  routes?: Array<{
    domain: string;
    from_user: string;
    vmta: string;
  }>;
}

export default function CampaignInfo({
  sender,
  senderServerId,
  status,
  runtimeOfferId,
  suppression,
  routes,
}: CampaignInfoProps) {
  return (
    <section className="space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold tracking-tight">
          Campaign Info
        </h3>

        <span
          className={`px-3 py-1 rounded-full text-xs font-medium border
            ${
              status === "LIVE"
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                : "bg-muted text-muted-foreground border-border"
            }
          `}
        >
          {status || "DRAFT"}
        </span>
      </div>

      {/* Basic Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        <Info label="Sender" value={senderServerId ?? "—"} />
        <Info label="Offer ID" value={runtimeOfferId || "-"} />
      </div>

      {/* Suppression */}
      {suppression && (
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Suppression Stats
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <StatBox label="Input" value={suppression.inputCount} />
            <StatBox label="Final" value={suppression.finalCount} />
            <StatBox
              label="Removed"
              value={suppression.removedCount}
              highlight
            />
          </div>
        </div>
      )}

      {/* Routes */}
      {routes && routes.length > 0 && (
        <div className="space-y-3">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Routes
          </span>

          <div className="flex flex-wrap gap-2">
            {routes.map((route, i) => (
              <div
                key={i}
                className="px-3 py-1.5 rounded-full text-xs border bg-muted text-foreground border-border flex items-center gap-2"
              >
                <strong className="font-medium">{route.domain}</strong>
                <span className="opacity-50">→</span>
                <span>{route.from_user}</span>
                <span className="text-muted-foreground">
                  ({route.vmta})
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function Info({ label, value }: { label: string; value: any }) {
  return (
    <div className="space-y-1">
      <div className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
        {label}
      </div>
      <div className="text-base font-medium">
        {value}
      </div>
    </div>
  );
}

function StatBox({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 transition
        ${
          highlight
            ? "border-rose-500/30 bg-rose-500/10"
            : "border-border bg-muted"
        }
      `}
    >
      <div className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="text-lg font-semibold mt-1">
        {value}
      </div>
    </div>
  );
}