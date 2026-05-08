export const dynamic = "force-dynamic";

import { Settings } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg text-fg">
      {/* Admin Header */}
      <div className="relative border-b border-border bg-card overflow-hidden">
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-fg">
                Admin Panel
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Manage system configuration, access control and infrastructure
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content Area – no extra container; pages handle their own layout */}
      <div>{children}</div>
    </div>
  );
}