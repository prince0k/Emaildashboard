"use client";

import { useEffect, useState } from "react";
import { Eye, Edit, Trash2, Loader2 } from "lucide-react";
import {
  listCreatives,
  toggleCreativeStatus,
  deleteCreative,
} from "@/lib/creativeApi";
import CreativeEditor from "./CreativeEditor";

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
      <div className="bg-card/80 backdrop-blur-sm border border-border/60 rounded-2xl shadow-soft p-12 text-center text-sm text-muted-foreground">
        No creatives yet. Click <span className="font-semibold text-foreground">Add Creative</span> to create one.
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-transparent">
        {items.map((c) => {
          const isActive = c.status === "active";

          return (
            <div
              key={c._id}
              className="
                rounded-2xl
                border border-border/60
                bg-card/80 backdrop-blur-sm
                overflow-hidden
                shadow-soft
                transition hover:shadow-medium
              "
            >
              {/* PREVIEW */}
              <div className="relative group bg-muted">
                <div className="aspect-[3/4] overflow-hidden bg-transparent flex justify-center">
                  <div className="scale-[0.50] origin-top-center -translate-y-25">
                    <iframe
                      src={`/api/offers/creatives/preview?id=${c._id}`}
                      className="w-[600px] h-[900px] pointer-events-none"
                      style={{ border: "none" }}
                    />
                  </div>
                </div>

                {/* OVERLAY */}
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-4">
                  <ActionIcon onClick={() => setPreviewId(c._id)}>
                    <Eye size={16} />
                  </ActionIcon>

                  <ActionIcon onClick={() => setEditCreative(c)}>
                    <Edit size={16} />
                  </ActionIcon>

                  <ActionIcon
                    onClick={async () => {
                      if (!confirm("Delete this creative?")) return;
                      await deleteCreative(c._id);
                      load();
                    }}
                    destructive
                  >
                    <Trash2 size={16} />
                  </ActionIcon>
                </div>
              </div>

              {/* FOOTER */}
              <div className="p-4 flex items-center justify-between border-t border-border/60">
                <div>
                  <div className="text-sm font-semibold text-foreground">
                    {c.name}
                  </div>

                  <span
                    className={`
                      inline-flex items-center gap-2
                      mt-2 px-3 py-1
                      text-xs font-semibold
                      rounded-full border
                      ${
                        isActive
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                          : "bg-muted text-muted-foreground border-border/60"
                      }
                    `}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${
                        isActive ? "bg-emerald-500" : "bg-muted-foreground"
                      }`}
                    />
                    {c.status}
                  </span>
                </div>

                <button
                  onClick={async () => {
                    try {
                      setLoadingId(c._id);
                      await toggleCreativeStatus(
                        c._id,
                        isActive ? "paused" : "active"
                      );
                      load();
                    } finally {
                      setLoadingId(null);
                    }
                  }}
                  disabled={loadingId === c._id}
                  className={`
                    inline-flex items-center gap-2
                    px-3 py-1.5
                    text-xs font-semibold
                    rounded-xl border
                    transition
                    disabled:opacity-50
                    ${
                      isActive
                        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 hover:bg-amber-500/20"
                        : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                    }
                  `}
                >
                  {loadingId === c._id && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  )}
                  {isActive ? "Pause" : "Activate"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* PREVIEW MODAL */}
      {previewId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setPreviewId(null)}
          />

          <div className="relative bg-card border border-border/60 rounded-2xl shadow-large w-[1000px] h-[90vh] overflow-hidden">
            <button
              onClick={() => setPreviewId(null)}
              className="absolute top-4 right-4 z-10 px-4 py-2 text-xs font-semibold rounded-xl bg-muted hover:bg-muted/70 transition"
            >
              Close
            </button>

            <iframe
              src={`/api/offers/creatives/preview?id=${previewId}`}
              className="w-full h-full"
              style={{ border: "none" }}
            />
          </div>
        </div>
      )}

      {editCreative && (
        <CreativeEditor
          offerId={offerId}
          creative={editCreative}
          onClose={() => setEditCreative(null)}
          onSaved={load}
        />
      )}
    </>
  );
}

/* Reusable icon button */
function ActionIcon({
  children,
  onClick,
  destructive,
}: {
  children: React.ReactNode;
  onClick: () => void;
  destructive?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        p-3 rounded-xl
        border border-border/60
        bg-card/90
        backdrop-blur
        hover:bg-muted/60
        transition
        ${destructive ? "text-destructive" : "text-foreground"}
      `}
    >
      {children}
    </button>
  );
}