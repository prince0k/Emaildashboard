"use client";

import { useEffect, useState } from "react";
import { KeyRound, Loader2 } from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";
import api from "@/lib/api";
export const dynamic = "force-dynamic";

export default function PermissionsPage() {
  const [permissions, setPermissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
    try {
      setLoading(true);

      const res = await api.get("/permissions");

      setPermissions(res.data.permissions || []);
    } catch (err) {
      console.error("Failed to load permissions:", err);
    } finally {
      setLoading(false);
    }
  }

    load();
  }, []);

  const grouped = permissions.reduce((acc: any, perm: any) => {
    if (!acc[perm.module]) acc[perm.module] = [];
    acc[perm.module].push(perm);
    return acc;
  }, {});

  return (
    <ProtectedRoute permission="permission.view">
      <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header Card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-card to-muted/20 border border-border shadow-sm p-6">
          {/* Subtle grid overlay – optional */}
          <div className="absolute inset-0 bg-grid-white/5 [mask-image:radial-gradient(ellipse_at_top,white,transparent)]" />

          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            {/* Left Section */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <KeyRound className="w-7 h-7" />
              </div>

              <div>
                <h1 className="text-2xl font-semibold text-fg tracking-tight">
                  Permissions
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  System-level access control definitions
                </p>
              </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-4">
              {/* Total permissions stat */}
              <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-bg/50">
                <span className="text-xs text-muted-foreground">Total permissions</span>
                <span className="text-lg font-semibold text-fg">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : permissions.length}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Loading Skeleton */}
        {loading && (
          <div className="space-y-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="rounded-2xl border border-border bg-card p-6 shadow-sm animate-pulse">
                <div className="flex items-center justify-between mb-4">
                  <div className="h-6 bg-muted/20 rounded w-32" />
                  <div className="h-4 bg-muted/20 rounded w-20" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {[...Array(6)].map((_, j) => (
                    <div key={j} className="h-8 bg-muted/20 rounded" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && permissions.length === 0 && (
          <div className="rounded-2xl border border-border bg-card p-12 text-center shadow-sm">
            <div className="flex flex-col items-center gap-3">
              <KeyRound className="w-12 h-12 text-muted-foreground/40" />
              <p className="text-muted-foreground">No permissions found.</p>
            </div>
          </div>
        )}

        {/* Modules */}
        {!loading &&
          Object.keys(grouped).map((module) => (
            <div
              key={module}
              className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-fg capitalize flex items-center gap-2">
                  <span className="w-1 h-5 bg-primary rounded-full" />
                  {module}
                </h3>
                <span className="text-xs text-muted-foreground bg-muted/30 px-2 py-1 rounded-full">
                  {grouped[module].length} permission{grouped[module].length !== 1 ? 's' : ''}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {grouped[module].map((perm: any) => (
                  <div
                    key={perm._id}
                    className="group flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-bg text-sm text-fg hover:bg-muted/10 transition-colors"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-muted-foreground/50 group-hover:text-primary/50 transition-colors" />
                    <span className="truncate">{perm.name}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
      </div>
    </ProtectedRoute>
  );
}