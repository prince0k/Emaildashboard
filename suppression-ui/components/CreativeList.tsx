"use client";

import { useEffect, useState } from "react";
import { Eye, Edit, Trash2, Loader2, Play, Pause } from "lucide-react";
import {
  listCreatives,
  toggleCreativeStatus,
  deleteCreative,
} from "@/lib/creativeApi";
import CreativeEditor from "./CreativeEditor";
import { cn } from "@/lib/utils";

import type { Creative } from "@/types/creative";

type Props = {
  offerId: string;
};

export default function CreativeList({ offerId }: Props) {
  const [items, setItems] = useState<Creative[]>([]);
  const [editCreative, setEditCreative] = useState<Creative | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const load = async () => {
    const data = await listCreatives(offerId);
    setItems(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    load();
  }, [offerId]);

  if (items.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-2xl p-12 text-center text-sm text-text-muted">
        No creatives yet. Click <span className="font-bold text-foreground">Add Creative</span> to create one.
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((c) => {
          const isActive = c.status === "active";

          return (
            <div
              key={c._id}
              className="group bg-surface border border-border rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 hover:border-border-bright hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)] flex flex-col"
            >
              {/* PREVIEW CONTAINER */}
              <div className="relative aspect-[4/5] bg-void overflow-hidden border-b border-border">
                <div className="absolute top-2 left-1/2 -translate-x-1/2 origin-top scale-[0.48]">
                  <iframe
                    src={`/api/offers/creatives/preview?id=${c._id}`}
                    className="w-[780px] h-[1300px] pointer-events-none bg-white shadow-2xl"
                    style={{ border: "none" }}
                    scrolling="no"
                  />
                </div>

                {/* OVERLAY ACTIONS */}
                <div className="absolute inset-0 bg-void/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-3">
                  <ActionIcon onClick={() => setPreviewId(c._id)} icon={Eye} label="Preview" />
                  <ActionIcon onClick={() => setEditCreative(c)} icon={Edit} label="Edit" />
                  <ActionIcon
                    onClick={async () => {
                      if (!confirm("Delete this creative?")) return;
                      await deleteCreative(c._id);
                      load();
                    }}
                    icon={Trash2}
                    label="Delete"
                    destructive
                  />
                </div>
              </div>

              {/* INFO & STATUS FOOTER */}
              <div className="p-4 space-y-3 bg-card/30 flex-1 flex flex-col justify-between">
                <div className="space-y-1 min-w-0">
                  <div className="text-sm font-bold text-foreground truncate" title={c.name}>
                    {c.name}
                  </div>
                  <div className={cn(
                    "inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                    isActive ? "bg-emerald/10 text-emerald" : "bg-panel text-text-muted border border-border"
                  )}>
                    <div className={cn("w-1 h-1 rounded-full", isActive ? "bg-emerald animate-pulse" : "bg-text-muted")} />
                    {c.status}
                  </div>
                </div>

                <button
                  onClick={async () => {
                    try {
                      setLoadingId(c._id);
                      await toggleCreativeStatus(c._id, isActive ? "paused" : "active");
                      load();
                    } finally {
                      setLoadingId(null);
                    }
                  }}
                  disabled={loadingId === c._id}
                  className={cn(
                    "w-full flex items-center justify-center gap-2 py-2 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all",
                    isActive 
                      ? "bg-amber/10 text-amber border border-amber/20 hover:bg-amber/20" 
                      : "bg-emerald/10 text-emerald border border-emerald/20 hover:bg-emerald/20"
                  )}
                >
                  {loadingId === c._id ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : isActive ? (
                    <><Pause size={14} /> Pause</>
                  ) : (
                    <><Play size={14} /> Activate</>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODALS */}
      {previewId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-void/80 backdrop-blur-md" onClick={() => setPreviewId(null)} />
          <div className="relative bg-surface border border-border rounded-3xl shadow-2xl w-full max-w-5xl h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="h-14 border-b border-border flex items-center justify-between px-6 bg-panel/50">
              <span className="text-sm font-bold uppercase tracking-widest text-text-muted">Creative Preview</span>
              <button onClick={() => setPreviewId(null)} className="text-xs font-bold text-primary hover:text-cyan uppercase tracking-widest">Close [ESC]</button>
            </div>
            <iframe src={`/api/offers/creatives/preview?id=${previewId}`} className="w-full h-full" style={{ border: "none" }} />
          </div>
        </div>
      )}

      {editCreative && (
        <CreativeEditor offerId={offerId} creative={editCreative} onClose={() => setEditCreative(null)} onSaved={load} />
      )}
    </>
  );
}

function ActionIcon({ icon: Icon, onClick, destructive, label }: any) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group flex flex-col items-center gap-1.5 p-3 rounded-2xl border transition-all duration-200",
        destructive 
          ? "border-rose/20 bg-rose/10 text-rose hover:bg-rose/20" 
          : "border-border bg-surface/80 text-foreground hover:border-primary hover:text-primary"
      )}
    >
      <Icon size={18} />
      <span className="text-[9px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">{label}</span>
    </button>
  );
}