"use client";

import { Search } from "lucide-react";
import ThemeSwitcher from "../ThemeSwitcher";

export function Topbar() {
  return (
    <header className="h-14 bg-surface/60 backdrop-blur-2xl border-b border-border flex items-center justify-between px-6 z-40 sticky top-0">
      <div className="flex flex-col">
        <h1 className="text-sm md:text-base font-bold tracking-tight">Command Center</h1>
        <span className="font-mono text-[10px] text-text-muted uppercase tracking-widest hidden md:block">
          email-core v4.2.1 · operations
        </span>
      </div>

      <div className="flex-1 max-w-md mx-4 hidden sm:block">
        <button className="w-full bg-panel/50 border border-border px-3 py-1.5 rounded-lg font-mono text-[11px] text-text-secondary flex items-center gap-2 hover:border-border-bright transition-all group">
          <Search size={14} className="group-hover:text-primary transition-colors" />
          Search Command... <span className="ml-auto bg-panel px-1.5 rounded text-[10px] text-text-muted">Ctrl+K</span>
        </button>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-[11px] font-bold text-emerald bg-emerald/10 px-3 py-1 rounded-full border border-emerald/20">
          <div className="w-1.5 h-1.5 bg-emerald rounded-full animate-pulse-slow" />
          <span className="hidden sm:inline">Systems Nominal</span>
        </div>
        
        <ThemeSwitcher />
        
        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-card to-panel border border-border flex items-center justify-center text-[11px] font-bold">
          EC
        </div>
      </div>
    </header>
  );
}
