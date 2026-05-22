import React from "react";
import { CheckCircle2, ChevronDown } from "lucide-react";

export function StatusCheck({ label, checked }: { label: string, checked: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[14px] font-bold text-muted-foreground">{label}</span>
      {checked ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <div className="w-4 h-4 rounded-full border border-border/40" />}
    </div>
  );
}

export function SuppressionLayer({ label, active, locked, onToggle }: { label: string; active: boolean; locked: boolean; onToggle?: () => void }) {
  return (
    <div
      onClick={locked ? undefined : onToggle}
      className={`flex items-center justify-between text-sm font-bold p-3.5 rounded-xl transition-all ${
        locked ? "cursor-default" : "cursor-pointer hover:bg-secondary/30"
      } ${active ? "bg-primary/5 text-foreground" : "opacity-40 bg-muted/10"}`}
    >
      <span className={active ? "text-primary/90" : "text-muted-foreground"}>{label}</span>
      <div className="flex items-center gap-2">
        {locked && <span className="text-[10px] text-muted-foreground/50 uppercase">Locked</span>}
        <div className={`w-9 h-5 rounded-full relative transition-colors duration-300 ${active ? "bg-primary/40" : "bg-muted/40"}`}>
          <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-md transition-all duration-300 ${active ? "right-0.5" : "left-0.5"}`}></div>
        </div>
      </div>
    </div>
  );
}

export function ConfirmItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-muted/20 rounded-lg p-3">
      <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">{label}</div>
      <div className="text-sm font-bold truncate">{value || "—"}</div>
    </div>
  );
}

export function BreakdownItem({ label, value, negative, positive }: { label: string; value?: number; negative?: boolean; positive?: boolean }) {
  const v = value || 0;
  return (
    <div className="flex items-center justify-between bg-background/40 rounded-lg px-3 py-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`text-sm font-bold ${positive ? "text-emerald-400" : negative && v > 0 ? "text-red-400" : "text-foreground"}`}>
        {positive && v > 0 ? "+" : ""}{v.toLocaleString()}
      </span>
    </div>
  );
}

export function Input({ label, value, onChange, placeholder = "" }: { label: string, value: string, onChange: (v: string) => void, placeholder?: string }) {
  return (
    <div className="space-y-3">
      <label className="text-[13px] font-bold text-muted-foreground uppercase tracking-[0.15em] ml-1">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-background/60 border border-border/40 rounded-[1.5rem] p-6 text-lg font-medium focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-muted-foreground/20"
      />
    </div>
  );
}

export function Select({ label, value, onChange, options }: { label: string, value: string, onChange: (v: string) => void, options: { value: string, label: string }[] }) {
  return (
    <div className="space-y-3">
      <label className="text-[13px] font-bold text-muted-foreground uppercase tracking-[0.15em] ml-1">{label}</label>
      <div className="relative group">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-background/60 border border-border/40 rounded-[1.5rem] p-6 text-lg font-medium focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all appearance-none cursor-pointer group-hover:border-primary/30"
        >
          <option value="">{label}</option>
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none opacity-30 group-hover:opacity-100 transition-opacity">
          <ChevronDown className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
