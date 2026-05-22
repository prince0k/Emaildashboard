"use client";

import { useState } from "react";
import { X, Loader2, Save, Terminal, Code } from "lucide-react";
import { createCreative, updateCreative } from "@/lib/creativeApi";
import type { Creative } from "@/types/creative";
import api from "@/lib/api";
import { cn } from "@/lib/utils";

type Props = {
  offerId: string;
  creative?: Creative;
  onClose: () => void;
  onSaved?: () => void;
};

export default function CreativeEditor({
  offerId,
  creative,
  onClose,
  onSaved,
}: Props) {
  const [name, setName] = useState(creative?.name || "");
  const [html, setHtml] = useState(creative?.html || "");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!name.trim() || !html.trim()) {
      alert("Name & HTML required");
      return;
    }

    setLoading(true);

    try {
      if (creative) {
        await updateCreative(creative._id, { name, html });
      } else {
        await createCreative({ offerId, name, html });
      }

      onSaved?.();
      onClose();
    } catch (err) {
      console.error("Save creative failed", err);
      alert("Failed to save creative");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      {/* Overlay */}
      <div className="absolute inset-0 bg-void/80 backdrop-blur-md" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-5xl bg-surface border border-border rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
        
        {/* Header */}
        <div className="h-16 border-b border-border flex items-center justify-between px-6 bg-panel/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Code size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight">
                {creative ? "Modify Creative Asset" : "Initialize New Asset"}
              </h2>
              <p className="text-[10px] text-text-muted uppercase tracking-widest font-mono">
                {creative ? `ID: ${creative._id}` : `Offer: ${offerId}`}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-hover text-text-muted transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted px-1">Asset Label</label>
              <input
                placeholder="e.g. Black Friday Promo v1"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-panel border border-border rounded-xl px-4 py-2.5 text-sm focus:border-primary outline-none transition-all placeholder:text-text-muted/30"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted px-1">Batch Upload Images</label>
              <div className="relative group">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={async (e) => {
                    const files = e.target.files;
                    if (!files || files.length === 0) return;
                    const form = new FormData();
                    for (let i = 0; i < files.length; i++) form.append("images", files[i]);
                    form.append("offerId", offerId);
                    try {
                      const res = await api.post("/offers/creatives/uploadImage", form);
                      alert(`Successfully synchronized ${res.data.files.length} assets.`);
                    } catch (err) {
                      alert("Asset synchronization failed.");
                    }
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="bg-panel border border-border rounded-xl px-4 py-2.5 text-xs text-text-secondary flex items-center gap-2 group-hover:border-primary transition-colors">
                  <Terminal size={14} />
                  Click or drag to synchronize media assets
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2 flex-1 flex flex-col min-h-[400px]">
            <div className="flex items-center justify-between px-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted">HTML Source Code</label>
              <span className="text-[10px] font-mono text-cyan">UTF-8 Encoded</span>
            </div>
            <textarea
              placeholder="<html>...</html>"
              value={html}
              onChange={(e) => setHtml(e.target.value)}
              className="flex-1 w-full bg-void/50 border border-border rounded-xl p-4 text-xs font-mono focus:border-primary outline-none transition-all placeholder:text-text-muted/20 resize-none"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="h-20 border-t border-border flex items-center justify-end gap-4 px-6 bg-panel/30 shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-[11px] font-bold uppercase tracking-widest rounded-xl border border-border text-text-muted hover:text-foreground hover:bg-hover transition-all"
          >
            Discard
          </button>

          <button
            onClick={submit}
            disabled={loading}
            className={cn(
              "flex items-center gap-2 px-8 py-2.5 text-[11px] font-bold uppercase tracking-widest rounded-xl transition-all shadow-xl",
              loading 
                ? "bg-panel text-text-muted cursor-not-allowed" 
                : "bg-primary text-white hover:shadow-[0_0_20px_rgba(99,130,255,0.4)] active:scale-95"
            )}
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <><Save size={16} /> Deploy Asset</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}