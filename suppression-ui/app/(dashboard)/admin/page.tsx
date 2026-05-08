"use client";

import Link from "next/link";
import {
  ShieldCheck,
  KeyRound,
  Users,
  Server,
  LayoutDashboard,
} from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";

export const dynamic = "force-dynamic";

export default function AdminHome() {
  return (
    <ProtectedRoute permission="role.view">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-fg">
                Dashboard
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Welcome to the admin control panel
              </p>
            </div>
          </div>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Users Card */}
          <Link
            href="/admin/users"
            className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:shadow-md hover:border-primary/30 hover:bg-muted/5"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-300">
                <Users className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-fg">User Management</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Create and manage user accounts, assign roles
                </p>
                <div className="mt-3 flex items-center text-xs text-primary/70 group-hover:text-primary transition-colors">
                  <span>Manage users</span>
                  <span className="ml-1 group-hover:translate-x-0.5 transition-transform">→</span>
                </div>
              </div>
            </div>
          </Link>

          {/* Senders Card */}
          <Link
            href="/admin/senders"
            className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:shadow-md hover:border-primary/30 hover:bg-muted/5"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-300">
                <Server className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-fg">Sender Management</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Configure email sending infrastructure and routes
                </p>
                <div className="mt-3 flex items-center text-xs text-primary/70 group-hover:text-primary transition-colors">
                  <span>Manage senders</span>
                  <span className="ml-1 group-hover:translate-x-0.5 transition-transform">→</span>
                </div>
              </div>
            </div>
          </Link>

          {/* Roles Card */}
          <Link
            href="/admin/roles"
            className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:shadow-md hover:border-primary/30 hover:bg-muted/5"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-300">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-fg">Role Management</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Define roles and assign permission sets
                </p>
                <div className="mt-3 flex items-center text-xs text-primary/70 group-hover:text-primary transition-colors">
                  <span>Manage roles</span>
                  <span className="ml-1 group-hover:translate-x-0.5 transition-transform">→</span>
                </div>
              </div>
            </div>
          </Link>

          {/* Permissions Card */}
          <Link
            href="/admin/permissions"
            className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:shadow-md hover:border-primary/30 hover:bg-muted/5"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-300">
                <KeyRound className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-fg">Permission Management</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  View and organize system permissions
                </p>
                <div className="mt-3 flex items-center text-xs text-primary/70 group-hover:text-primary transition-colors">
                  <span>View permissions</span>
                  <span className="ml-1 group-hover:translate-x-0.5 transition-transform">→</span>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </ProtectedRoute>
  );
}