"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, Loader2 } from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";
import api from "@/lib/api";
export const dynamic = "force-dynamic";

export default function RolesPage() {
  const [roles, setRoles] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);

      const [roleRes, permRes] = await Promise.all([
        api.get("/roles"),
        api.get("/permissions"),
      ]);

      setRoles(roleRes.data.roles || []);
      setPermissions(permRes.data.permissions || []);
      setLoading(false);
    }

    load();
  }, []);

  const groupedPermissions = permissions.reduce(
    (acc: any, perm: any) => {
      if (!acc[perm.module]) acc[perm.module] = [];
      acc[perm.module].push(perm);
      return acc;
    },
    {}
  );

  const togglePermission = async (
    roleId: string,
    permId: string,
    currentPerms: string[]
  ) => {
    const updated = currentPerms.includes(permId)
      ? currentPerms.filter((p) => p !== permId)
      : [...currentPerms, permId];

    await api.put(`/roles/${roleId}`, {
      permissions: updated,
    });

    setRoles((prev) =>
      prev.map((role) =>
        role._id === roleId
          ? {
              ...role,
              permissions: permissions.filter((p) =>
                updated.includes(p._id)
              ),
            }
          : role
      )
    );
  };

  return (
    <ProtectedRoute permission="role.view">
      <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header Card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-card to-muted/20 border border-border shadow-sm p-6">
          {/* Subtle grid overlay – optional */}
          <div className="absolute inset-0 bg-grid-white/5 [mask-image:radial-gradient(ellipse_at_top,white,transparent)]" />

          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            {/* Left Section */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <ShieldCheck className="w-7 h-7" />
              </div>

              <div>
                <h1 className="text-2xl font-semibold text-fg tracking-tight">
                  Role Management
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Configure roles and their permissions
                </p>
              </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-4">
              {/* Total roles stat */}
              <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-bg/50">
                <span className="text-xs text-muted-foreground">Total roles</span>
                <span className="text-lg font-semibold text-fg">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : roles.length}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Loading Skeleton */}
        {loading && (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="rounded-2xl border border-border bg-card p-6 shadow-sm animate-pulse">
                <div className="flex items-center justify-between mb-4">
                  <div className="h-6 bg-muted/20 rounded w-32" />
                  <div className="h-4 bg-muted/20 rounded w-20" />
                </div>
                <div className="space-y-3">
                  <div className="h-4 bg-muted/20 rounded w-24" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {[...Array(6)].map((_, j) => (
                      <div key={j} className="h-8 bg-muted/20 rounded" />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && roles.length === 0 && (
          <div className="rounded-2xl border border-border bg-card p-12 text-center shadow-sm">
            <div className="flex flex-col items-center gap-3">
              <ShieldCheck className="w-12 h-12 text-muted-foreground/40" />
              <p className="text-muted-foreground">No roles found.</p>
            </div>
          </div>
        )}

        {/* Roles List */}
        {!loading &&
          roles.map((role: any) => (
            <div
              key={role._id}
              className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-6"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-fg">{role.name}</h3>
                <span className="text-xs text-muted-foreground bg-muted/30 px-2 py-1 rounded-full">
                  {role.permissions?.length || 0} permissions
                </span>
              </div>

              {Object.keys(groupedPermissions).map((module) => (
                <div key={module} className="space-y-3">
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                    <span className="w-1 h-4 bg-primary rounded-full" />
                    {module}
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {groupedPermissions[module].map((perm: any) => {
                      const checked = role.permissions?.some(
                        (p: any) => p._id === perm._id
                      );

                      return (
                        <label
                          key={perm._id}
                          className={`
                            flex items-center gap-3 px-3 py-2 rounded-lg border 
                            transition-all cursor-pointer group
                            ${checked
                              ? "border-primary/30 bg-primary/5"
                              : "border-border bg-bg hover:bg-muted/10"
                            }
                          `}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() =>
                              togglePermission(
                                role._id,
                                perm._id,
                                role.permissions.map((p: any) => p._id)
                              )
                            }
                            className="
                              w-4 h-4 rounded border-border 
                              text-primary focus:ring-primary/30
                              accent-primary
                            "
                          />
                          <span className="text-sm text-fg flex-1">
                            {perm.name.split(".")[1] || perm.name}
                          </span>
                          <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                            {perm.module}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ))}
      </div>
    </ProtectedRoute>
  );
}