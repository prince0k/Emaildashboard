"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import CreativeList from "@/components/CreativeList";
import CreativeEditor from "@/components/CreativeEditor";
import { Plus, Layers, ArrowLeft, Loader2 } from "lucide-react";
import api from "@/lib/api";

export default function CreativesPage({ params }: any) {
  const offerId = params?.offerId;

  const [showEditor, setShowEditor] = useState(false);
  const [creativeCount, setCreativeCount] = useState<number | null>(null);
  const [loadingCount, setLoadingCount] = useState(true);

  useEffect(() => {
    async function loadCount() {
      try {
        setLoadingCount(true);
        const res = await api.get(`/offers/creatives/list`, {
          params: { offerId },
        });
        setCreativeCount(res.data.length);
      } catch (error) {
        console.error("Failed to load creative count", error);
      } finally {
        setLoadingCount(false);
      }
    }

    if (offerId) loadCount();
  }, [offerId]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back link to Offer Workspace */}
      <Link
        href={`/offers/${params.offerId}`}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-fg transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Offer Workspace
      </Link>

      {/* Header Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-card to-muted/20 border border-border shadow-sm p-6">
        <div className="absolute inset-0 bg-grid-white/5 [mask-image:radial-gradient(ellipse_at_top,white,transparent)]" />
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Layers className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-fg tracking-tight">
                Creatives
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                HTML templates linked to this offer
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Creative count stat */}
            <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-bg/50">
              <span className="text-xs text-muted-foreground">Total creatives</span>
              <span className="text-lg font-semibold text-fg">
                {loadingCount ? <Loader2 className="w-4 h-4 animate-spin" /> : creativeCount ?? 0}
              </span>
            </div>

            <button
              onClick={() => setShowEditor(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:opacity-90 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/30 shadow-sm hover:shadow-md"
            >
              <Plus className="w-4 h-4" />
              Add Creative
            </button>
          </div>
        </div>
      </div>

      {/* List Card */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
        <CreativeList offerId={params.offerId} />
      </div>

      {/* Modal */}
      {showEditor && (
        <CreativeEditor
          offerId={params.offerId}
          onClose={() => setShowEditor(false)}
        />
      )}
    </div>
  );
}