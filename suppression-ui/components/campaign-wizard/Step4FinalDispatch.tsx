import React from "react";
import { Calendar, Save, Send } from "lucide-react";
import { StatusCheck } from "./shared/FormComponents";

export default function Step4FinalDispatch({
  step, isFullscreen, handleSaveDraft, handleSubmit,
  form, setForm, loading
}: any) {
  if (step !== 4 || isFullscreen) return null;

  return (
    <div className="block space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-secondary/20 border border-border/40 rounded-[3rem] p-12 backdrop-blur-3xl shadow-2xl relative overflow-hidden">
        <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-primary/10 rounded-full blur-[100px]"></div>

        <div className="flex items-center justify-between mb-10 relative z-10">
          <h2 className="text-2xl font-bold flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/30">
              <Calendar className="w-6 h-6" />
            </div>
            4. Final Dispatch & Scheduling
          </h2>
          <div className="flex items-center gap-3">
            <button onClick={handleSaveDraft} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-secondary/50 text-sm font-bold hover:bg-secondary transition-all">
              <Save className="w-4 h-4" /> Save
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !form.sender || !form.offerId || !form.segmentName}
              className="flex items-center gap-2 px-8 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-black hover:scale-105 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
            >
              Launch <Send className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 relative z-10">
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.15em] ml-1">Scheduled Deployment Date</label>
              <div className="relative group">
                <input
                  type="date"
                  value={form.scheduledDate}
                  onChange={e => setForm({ ...form, scheduledDate: e.target.value })}
                  className="w-full bg-background/80 border border-border/40 rounded-[1rem] p-5 text-base font-black focus:outline-none focus:ring-4 focus:ring-primary/20 transition-all appearance-none"
                />
                <Calendar className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 opacity-20 pointer-events-none group-hover:opacity-40 transition-opacity" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.15em] ml-1">Total Send Count</label>
                <input
                  type="number"
                  value={form.totalSend || ""}
                  placeholder="e.g. 20000"
                  onChange={e => setForm({ ...form, totalSend: parseInt(e.target.value) || 0 })}
                  className="w-full bg-background/80 border border-border/40 rounded-[1rem] p-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/20 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.15em] ml-1">Seeds (comma-separated)</label>
                <input
                  type="text"
                  value={form.seeds}
                  placeholder="test@domain.com, seed@domain.com"
                  onChange={e => setForm({ ...form, seeds: e.target.value })}
                  className="w-full bg-background/80 border border-border/40 rounded-[1rem] p-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/20 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.15em] ml-1">Seed After (X Emails)</label>
                <input
                  type="number"
                  value={form.seedAfter || ""}
                  placeholder="e.g. 1000"
                  onChange={e => setForm({ ...form, seedAfter: parseInt(e.target.value) || "" })}
                  className="w-full bg-background/80 border border-border/40 rounded-[1rem] p-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/20 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.15em] ml-1">Seed Mode</label>
                <select
                  value={form.seedMode || "round"}
                  onChange={e => setForm({ ...form, seedMode: e.target.value as "round" | "random" })}
                  className="w-full bg-background/80 border border-border/40 rounded-[1rem] p-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/20 transition-all appearance-none"
                >
                  <option value="round">Round Robin</option>
                  <option value="random">Random Selection</option>
                </select>
              </div>
            </div>

            <div className="bg-background/40 border border-border/30 rounded-2xl p-5 space-y-4">
              <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
                ⚡ Speed Throttling & Rate Control
              </h4>
              <p className="text-[11px] text-muted-foreground">
                Throttle campaign sending speed by distributing the total emails evenly over a specified timeframe.
              </p>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1">Seconds</label>
                  <input
                    type="number"
                    value={form.sendInSeconds}
                    placeholder="Seconds"
                    onChange={e => setForm({ ...form, sendInSeconds: e.target.value ? Number(e.target.value) : "" })}
                    className="w-full bg-background/80 border border-border/40 rounded-lg p-2 text-xs text-center font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1">Minutes</label>
                  <input
                    type="number"
                    value={form.sendInMinutes}
                    placeholder="Minutes"
                    onChange={e => setForm({ ...form, sendInMinutes: e.target.value ? Number(e.target.value) : "" })}
                    className="w-full bg-background/80 border border-border/40 rounded-lg p-2 text-xs text-center font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1">Hours</label>
                  <input
                    type="number"
                    value={form.sendInHours}
                    placeholder="Hours"
                    onChange={e => setForm({ ...form, sendInHours: e.target.value ? Number(e.target.value) : "" })}
                    className="w-full bg-background/80 border border-border/40 rounded-lg p-2 text-xs text-center font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
            </div>

            <div className="bg-primary/5 border border-primary/10 p-6 rounded-2xl">
              <p className="text-[11px] text-muted-foreground font-medium leading-relaxed">
                <span className="text-primary font-black uppercase tracking-widest mr-2 underline decoration-2 underline-offset-4">Warning:</span>
                Deployment will initialize in <span className="text-foreground font-black">CREATED</span> status. Verification is required on the Review Page before live injection commences.
              </p>
            </div>
          </div>

          <div className="flex flex-col justify-end">
            <div className="bg-secondary/30 rounded-3xl p-8 border border-border/20">
              <h4 className="text-[13px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-6">Final Readiness Check</h4>
              <div className="space-y-3">
                <StatusCheck label="Infrastructure Verified" checked={!!form.sender} />
                <StatusCheck label="Offer & Segment Ready" checked={!!form.offerId && !!form.segmentName} />
                <StatusCheck label="Creative Validated" checked={!!form.creativeId} />
                <StatusCheck label="ID Formats Correct" checked={!!form.campaignName && !!form.runtimeOfferId} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
