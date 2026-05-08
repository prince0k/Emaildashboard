"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { createCreative, updateCreative } from "@/lib/creativeApi";
import type { Creative } from "@/types/creative";
import api from "@/lib/api"
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

  const uploadImage = async (file: File) => {

  const form = new FormData()

  form.append("image", file)
  form.append("offerId", offerId)

  const res = await api.post(
    "/offers/creatives/uploadImage",
    form
  )

  return res.data.url
}

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
    <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="
          relative w-full max-w-4xl
          bg-card/90 backdrop-blur-xl
          border border-border/60
          rounded-2xl
          shadow-large
          p-8
          space-y-8
        "
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">
              {creative ? "Edit Creative" : "Add Creative"}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {creative
                ? "Update your creative content"
                : "Create a new HTML creative"}
            </p>
          </div>

          <button
            onClick={onClose}
            className="
              p-2 rounded-xl
              hover:bg-muted/50
              transition
            "
            aria-label="Close"
          >
            <X size={18} className="text-muted-foreground" />
          </button>
        </div>

        {/* Form */}
        <div className="space-y-6">
          {/* Name */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Creative Name
            </label>
            <input
              placeholder="e.g. Black Friday Promo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="
                w-full
                bg-background
                border border-border/60
                rounded-xl
                px-4 py-2.5
                text-sm
                focus:outline-none focus:ring-2 focus:ring-primary/40
                transition
              "
            />
          </div>

          <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Upload Image
          </label>

          <input
            type="file"
            accept="image/*"
            multiple
            onChange={async (e) => {
              const files = e.target.files
              if (!files || files.length === 0) return

              const form = new FormData()

              for (let i = 0; i < files.length; i++) {
                form.append("images", files[i])
              }

              form.append("offerId", offerId)

              try {
                const res = await api.post(
                  "/offers/creatives/uploadImage",
                  form
                )

                console.log(res.data.files)

                alert(`Uploaded ${res.data.files.length} images`)
              } catch (err) {
                console.error(err)
                alert("Upload failed")
              }
            }}
          />
        </div>

          {/* HTML */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              HTML Content
            </label>
            <textarea
              placeholder="<html>...</html>"
              rows={16}
              value={html}
              onChange={(e) => setHtml(e.target.value)}
              className="
                w-full
                bg-background
                border border-border/60
                rounded-xl
                px-4 py-3
                text-sm font-mono
                focus:outline-none focus:ring-2 focus:ring-primary/40
                transition
              "
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4 pt-6 border-t border-border/60">
          <button
            onClick={onClose}
            className="
              px-5 py-2.5
              text-sm font-semibold
              rounded-xl
              border border-border/60
              bg-muted
              text-muted-foreground
              hover:bg-muted/70
              transition
            "
          >
            Cancel
          </button>

          <button
            onClick={submit}
            disabled={loading}
            className="
              inline-flex items-center gap-2
              px-5 py-2.5
              text-sm font-semibold
              rounded-xl
              bg-primary
              text-primary-foreground
              hover:opacity-90
              disabled:opacity-60
              transition
            "
          >
            {loading && (
              <Loader2 className="w-4 h-4 animate-spin" />
            )}
            {loading ? "Saving..." : "Save Creative"}
          </button>
        </div>
      </div>
    </div>
  );
}