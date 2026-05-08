"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2, ShieldAlert } from "lucide-react";
import { useAuth } from "@/lib/authContext";
import usePermission from "@/lib/usePermission";

type Props = {
  permission?: string;
  children: React.ReactNode;
};

export default function ProtectedRoute({
  permission,
  children,
}: Props) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const hasPermission = usePermission(permission || "");

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (permission && !hasPermission) {
      router.replace("/403");
    }
  }, [user, loading, permission, hasPermission, router]);

  // 🔄 Loading State
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-6">
        <div className="bg-card/80 backdrop-blur-sm border border-border/60 rounded-2xl shadow-soft px-8 py-6 flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          <span className="text-sm font-medium text-foreground">
            Checking access...
          </span>
        </div>
      </div>
    );
  }

  // 🚫 Not Logged In
  if (!user) return null;

  // 🚫 Permission Denied (fallback before redirect)
  if (permission && !hasPermission) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-6">
        <div className="max-w-md w-full bg-card/80 backdrop-blur-sm border border-border/60 rounded-2xl shadow-soft p-8 text-center space-y-4">
          <div className="flex justify-center">
            <div className="h-14 w-14 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center">
              <ShieldAlert className="w-6 h-6 text-destructive" />
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold">
              Access Denied
            </h2>
            <p className="text-sm text-muted-foreground mt-2">
              You don’t have permission to view this page.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}