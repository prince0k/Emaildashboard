import React from "react";

interface CreativeEditorProps {
  creativeOverride: string;
  setCreativeOverride: (v: string) => void;
  onSave: () => void;
  onReset: () => void;
  loading: boolean;
}

export default function CreativeEditor({
  creativeOverride,
  setCreativeOverride,
  onSave,
  onReset,
  loading,
}: CreativeEditorProps) {
  return (
    <section className="rounded-2xl border border-border bg-card p-8 shadow-sm space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold"> Creative</h3>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={onReset}
            disabled={loading}
            className="px-4 py-1.5 rounded-full text-xs font-semibold bg-red-500 hover:bg-red-400 text-white"
          >
             Reset
          </button>

          <button
            onClick={onSave}
            disabled={loading}
            className="px-4 py-1.5 rounded-full text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-white"
          >
             Save
          </button>
        </div>
      </div>

      <textarea
        value={creativeOverride}
        onChange={(e) => setCreativeOverride(e.target.value)}
        placeholder="Paste your HTML creative here..."
        rows={6}
        className="w-full rounded-lg border border-border bg-background text-foreground text-sm p-3 font-mono min-h-[220px] focus:outline-none focus:ring-2 focus:ring-primary/40"
      />
    </section>
  );
}
