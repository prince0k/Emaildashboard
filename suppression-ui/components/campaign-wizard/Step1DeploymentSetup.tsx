import React from "react";
import { Server, ArrowRight, Save } from "lucide-react";
import { Input, Select } from "./shared/FormComponents";

export default function Step1DeploymentSetup({ 
  step, setStep, isFullscreen, handleSaveDraft, 
  form, setForm, servers, currentServer, offers, segments, setIsManualName, setIsManualRuntimeId, toggleSelection,
  updateRouteFromUser, handleTextareaRoutesChange
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
          <Select
            label="1. Sender Server"
            value={form.sender}
            onChange={v => setForm({ ...form, sender: v, routeIds: [], routes: [] })}
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
        </div>

        {/* Routes Customization Card Section */}
        {currentServer && (
          <div className="border-t border-border/20 pt-8 mb-10 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-[15px] font-bold text-muted-foreground uppercase tracking-[0.15em]">Routes</h3>
              <span className="text-[12px] text-muted-foreground/60 italic">Saved automatically</span>
            </div>

            {/* Serialized Textarea */}
            <div className="space-y-2">
              <textarea
                value={(form.routes || []).map((r: any) => `${r.vmta}=>${r.domain}=>${r.from_user}`).join("\n")}
                onChange={(e) => handleTextareaRoutesChange(e.target.value)}
                placeholder="vmta=>domain=>from_user (one per line)"
                className="w-full h-40 bg-black text-white font-mono p-4 rounded-2xl border border-border/30 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm resize-y"
              />
            </div>

            {/* Routes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentServer.routes?.map((r: any) => {
                const isChecked = form.routeIds.includes(r._id);
                const customRoute = form.routes?.find((cr: any) => cr.vmta === r.vmta && cr.domain === r.domain);
                const displayFromUser = customRoute ? customRoute.from_user : r.from_user;

                return (
                  <div
                    key={r._id}
                    className={`p-5 rounded-2xl border transition-all ${
                      isChecked
                        ? "bg-primary/5 border-primary/40 shadow-sm"
                        : "bg-secondary/5 border-border/10 opacity-70"
                    }`}
                  >
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleSelection(r._id, "routeIds")}
                        className="w-4 h-4 rounded border-border/40 text-primary focus:ring-primary cursor-pointer"
                      />
                      <span className="text-sm font-semibold text-foreground/90">
                        {r.vmta} | {r.domain}
                      </span>
                    </label>

                    {isChecked && (
                      <div className="mt-3">
                        <input
                          type="text"
                          value={displayFromUser}
                          onChange={(e) => updateRouteFromUser(r.vmta, r.domain, e.target.value)}
                          className="w-full bg-black text-white font-mono rounded-xl px-4 py-2 text-sm border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                          placeholder="from_user"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

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
