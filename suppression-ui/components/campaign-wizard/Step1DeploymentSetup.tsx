import React from "react";
import { Server, ArrowRight, Save } from "lucide-react";
import { Input, Select } from "./shared/FormComponents";

export default function Step1DeploymentSetup({ 
  step, setStep, isFullscreen, handleSaveDraft, 
  form, setForm, servers, currentServer, offers, segments, setIsManualName, setIsManualRuntimeId, toggleSelection
}: any) {
  if (step !== 1 || isFullscreen) return null;

  return (
    <div className="block space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-secondary/20 border border-border/40 rounded-3xl p-8 backdrop-blur-md">
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-2xl font-bold flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/30">
              <Server className="w-6 h-6" />
            </div>
            1. Deployment Setup
          </h2>
          <div className="flex items-center gap-3">
            <button onClick={handleSaveDraft} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-secondary/50 text-sm font-bold hover:bg-secondary transition-all">
              <Save className="w-4 h-4" /> Save
            </button>
            <button onClick={() => setStep(2)} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:scale-105 transition-all shadow-lg shadow-primary/20">
              Next <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
          <Select
            label="1. Sender Server"
            value={form.sender}
            onChange={v => setForm({ ...form, sender: v })}
            options={servers.map((s: any) => ({ value: s._id, label: s.name }))}
          />
          <Select
            label="2. ISP Optimization"
            value={form.isp}
            onChange={v => setForm({ ...form, isp: v })}
            options={[
              { value: "gmail", label: "Gmail" },
              { value: "yahoo", label: "Yahoo" },
              { value: "hotmail", label: "Hotmail/Outlook" },
              { value: "comcast", label: "Comcast" },
              { value: "aol", label: "AOL" },
              { value: "other", label: "Other / Mixed" }
            ]}
          />
          <div className="space-y-4">
            <label className="text-[13px] font-bold text-muted-foreground uppercase tracking-[0.15em] ml-1">3. Multi-Route Selection ({form.routeIds.length})</label>
            <div className="bg-background/40 border border-border/40 rounded-2xl p-4 h-[120px] overflow-y-auto space-y-2 scrollbar-hide">
              {currentServer?.routes?.map((r: any) => (
                <div
                  key={r._id}
                  onClick={() => toggleSelection(r._id, "routeIds")}
                  className={`p-3 rounded-xl border cursor-pointer text-[15px] font-medium transition-all ${form.routeIds.includes(r._id)
                    ? "bg-primary/10 border-primary text-primary"
                    : "bg-secondary/10 border-border/20 hover:border-primary/40 text-muted-foreground"
                    }`}
                >
                  {r.vmta} ({r.domain})
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-border/20 pt-8">
          <Select
            label="4. Target Offer"
            value={form.offerId}
            onChange={v => setForm({ ...form, offerId: v })}
            options={offers.map((o: any) => ({ value: o._id, label: `${o.sid} - ${o.offer}` }))}
          />
          <Select
            label="5. Lead Segment"
            value={form.segmentName}
            onChange={v => setForm({ ...form, segmentName: v })}
            options={segments.map((s: any) => ({ value: s.name, label: `${s.name} (${s.count || '?'})` }))}
          />
          <Input
            label="6. Campaign Name"
            value={form.campaignName}
            onChange={v => { setIsManualName(true); setForm({ ...form, campaignName: v }); }}
            placeholder="Auto-generated if empty"
          />
          <Input
            label="7. Runtime Offer ID (Override)"
            value={form.runtimeOfferId}
            onChange={v => { setIsManualRuntimeId(true); setForm({ ...form, runtimeOfferId: v }); }}
            placeholder="Optional"
          />
        </div>
      </div>
    </div>
  );
}
