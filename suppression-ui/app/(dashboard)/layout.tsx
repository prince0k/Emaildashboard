"use client";

import Sidebar from "../../components/Sidebar";
import { Topbar } from "../../components/layout/Topbar";
import { TerminalBar } from "../../components/layout/TerminalBar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
      
      {/* ===== SIDEBAR ===== */}
      <Sidebar />

      {/* ===== MAIN AREA ===== */}
      <div className="flex-1 flex flex-col min-w-0 relative">

        {/* ===== TOP BAR ===== */}
        <Topbar />

        {/* ===== PAGE CONTENT ===== */}
        <main className="flex-1 overflow-y-auto scrollbar-hide">
          <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-8">
            {children}
          </div>
        </main>

        {/* ===== TERMINAL BAR ===== */}
        <TerminalBar />

      </div>
    </div>
  );
}