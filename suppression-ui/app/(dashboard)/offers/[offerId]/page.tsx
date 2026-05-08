"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Layers, Mail, User, Settings, ArrowLeft, Loader2 } from "lucide-react";
import api from "@/lib/api";

export default function OfferPage() {
  const { offerId } = useParams() as { offerId: string };
  const base = `/offers/${offerId}`;
  const [stats, setStats] = useState({
    creatives: 0,
    subjectLines: 0,
    fromLines: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        setLoading(true);
        const [creativesRes, subjectsRes, fromsRes] = await Promise.all([
          api.get("/offers/creatives/list", { params: { offerId } }),
          api.get("/offers/subject-lines/list", { params: { offerId } }),
          api.get("/offers/from-lines/list", { params: { offerId } }),
        ]);
        setStats({
          creatives: creativesRes.data.length || 0,
          subjectLines: subjectsRes.data.length || 0,
          fromLines: fromsRes.data.length || 0,
        });
      } catch (error) {
        console.error("Failed to load stats", error);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, [offerId]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back link */}
      <Link
        href="/offers"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-fg transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Offers
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
                Offer Workspace
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Configure creatives and email identities for this offer
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <Settings className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">Offer ID</span>
            <code className="px-3 py-1.5 rounded-lg border border-border bg-bg font-mono text-fg">
              {offerId}
            </code>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Creatives */}
        <Link
          href={`${base}/creatives`}
          className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:shadow-md hover:border-primary/30 hover:bg-muted/5"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-300">
              <Layers className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-fg">Creatives</h3>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-fg">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : stats.creatives}
                </span>
                <span className="text-sm text-muted-foreground">templates</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">HTML templates & status control</p>
              <div className="mt-3 flex items-center text-xs text-primary/70 group-hover:text-primary transition-colors">
                <span>Manage creatives</span>
                <span className="ml-1 group-hover:translate-x-0.5 transition-transform">→</span>
              </div>
            </div>
          </div>
        </Link>

        {/* Subject Lines */}
        <Link
          href={`${base}/subject-lines`}
          className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:shadow-md hover:border-emerald-500/30 hover:bg-muted/5"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform duration-300">
              <Mail className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-fg">Subject Lines</h3>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-fg">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : stats.subjectLines}
                </span>
                <span className="text-sm text-muted-foreground">variations</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Add & manage subject variations</p>
              <div className="mt-3 flex items-center text-xs text-emerald-600/70 dark:text-emerald-400/70 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                <span>Manage subjects</span>
                <span className="ml-1 group-hover:translate-x-0.5 transition-transform">→</span>
              </div>
            </div>
          </div>
        </Link>

        {/* From Lines */}
        <Link
          href={`${base}/from-lines`}
          className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:shadow-md hover:border-purple-500/30 hover:bg-muted/5"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform duration-300">
              <User className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-fg">From Lines</h3>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-fg">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : stats.fromLines}
                </span>
                <span className="text-sm text-muted-foreground">identities</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Sender names & identities</p>
              <div className="mt-3 flex items-center text-xs text-purple-600/70 dark:text-purple-400/70 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                <span>Manage from lines</span>
                <span className="ml-1 group-hover:translate-x-0.5 transition-transform">→</span>
              </div>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}