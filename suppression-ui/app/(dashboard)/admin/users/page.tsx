"use client";

import { useEffect, useState } from "react";
import { UserPlus, Users, Loader2 } from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";
import UserTable from "@/components/admin/UserTable";
import UserModal from "@/components/admin/UserModal";
import api from "@/lib/api";

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [refresh, setRefresh] = useState(false);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get("/users/list");
      setUsers(res.data.users);
      setTotal(res.data.total);
    } catch (err) {
      console.error("User load failed", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [refresh]);

  return (
    <ProtectedRoute permission="user.view">
      <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header Card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-card to-muted/20 border border-border shadow-sm p-6">
          <div className="absolute inset-0 bg-grid-white/5 [mask-image:radial-gradient(ellipse_at_top,white,transparent)]" />
          
          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            {/* Left Section */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Users className="w-7 h-7" />
              </div>

              <div>
                <h1 className="text-2xl font-semibold text-fg tracking-tight">
                  User Management
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Manage user accounts and permissions
                </p>
              </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-4">
              {/* Total users stat */}
              <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-bg/50">
                <span className="text-xs text-muted-foreground">Total users</span>
                <span className="text-lg font-semibold text-fg">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : total}
                </span>
              </div>

              <button
                onClick={() => setOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:opacity-90 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/30 shadow-sm hover:shadow-md"
              >
                <UserPlus className="w-4 h-4" />
                Create User
              </button>
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="rounded-2xl bg-card border border-border shadow-sm overflow-hidden">
          {loading ? (
            <div className="divide-y divide-border">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="p-4 flex items-center gap-4 animate-pulse">
                  <div className="w-8 h-8 rounded-lg bg-muted/20" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted/20 rounded w-1/4" />
                    <div className="h-3 bg-muted/20 rounded w-1/3" />
                  </div>
                  <div className="w-20 h-8 bg-muted/20 rounded-xl" />
                </div>
              ))}
            </div>
          ) : (
            <UserTable
              users={users}
              loading={false}
              onRefresh={() => setRefresh(!refresh)}
            />
          )}
        </div>

        {/* Modal */}
        {open && (
          <UserModal
            onClose={() => setOpen(false)}
            onSuccess={() => {
              setOpen(false);
              setRefresh(!refresh);
            }}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}