"use client";

import { useState } from "react";
import { Loader2, Pause, Play } from "lucide-react";
import { toggleCreativeStatus } from "@/lib/creativeApi";

export default function CreativeStatusToggle({ creative }) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(creative.status);

  const toggle = async () => {
    try {
      setLoading(true);

      const nextStatus = status === "active" ? "paused" : "active";

      await toggleCreativeStatus(creative._id, nextStatus);

      setStatus(nextStatus);
    } catch (err) {
      console.error("Failed to toggle status", err);
    } finally {
      setLoading(false);
    }
  };

  const isActive = status === "active";

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`
        inline-flex items-center gap-2
        px-3 py-1.5
        text-xs font-semibold
        rounded-xl
        border
        transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        ${
          isActive
            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
            : "bg-muted text-muted-foreground border-border/60 hover:bg-muted/60"
        }
      `}
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : isActive ? (
        <Pause className="w-3.5 h-3.5" />
      ) : (
        <Play className="w-3.5 h-3.5" />
      )}

      <span>
        {loading
          ? "Updating"
          : isActive
          ? "Active"
          : "Paused"}
      </span>
    </button>
  );
}