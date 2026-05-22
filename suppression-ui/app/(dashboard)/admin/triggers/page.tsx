"use client";

import { useEffect, useState } from "react";
import { Send, Server, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import api from "@/lib/api";
import type { Sender, Route } from "@/types/sender";

type TriggerSetting = {
  _id?: string;
  triggerType: string;
  senderId: any; // populated or ID
  routeId: string;
  active: boolean;
  routeName?: string;
};

const TRIGGER_TYPES = [
  { id: "WELCOME", label: "Welcome Email", description: "Sent after a user successfully signs up and verifies." },
  { id: "VERIFICATION", label: "Verification Email", description: "Sent when a user needs to confirm their email address." }
];

export default function TriggersPage() {
  const [senders, setSenders] = useState<Sender[]>([]);
  const [settings, setSettings] = useState<Record<string, TriggerSetting>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [pendingSelections, setPendingSelections] = useState<Record<string, { senderId: string, routeId: string }>>({});

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sendersRes, settingsRes] = await Promise.all([
        api.get("/senders"),
        api.get("/triggers/list")
      ]);

      setSenders(sendersRes.data.senders || []);
      
      const settingsMap: Record<string, TriggerSetting> = {};
      (settingsRes.data.settings || []).forEach((s: TriggerSetting) => {
        settingsMap[s.triggerType] = s;
      });
      setSettings(settingsMap);
    } catch (err) {
      console.error("Failed to load triggers", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdate = async (type: string, senderId: string, routeId: string) => {
    try {
      if (!senderId || !routeId) {
        // Just update local pending state, don't hit API yet
        setPendingSelections(prev => ({
          ...prev,
          [type]: { senderId, routeId }
        }));
        return;
      }

      setSaving(type);
      setMessage(null);
      
      await api.post("/triggers/update", {
        triggerType: type,
        senderId,
        routeId
      });

      // Clear pending state on success
      setPendingSelections(prev => {
        const next = { ...prev };
        delete next[type];
        return next;
      });

      setMessage({ type: 'success', text: `${type} trigger updated successfully.` });
      fetchData(); // Refresh to get populated data
    } catch (err: any) {
      console.error("Save failed", err);
      setMessage({ type: 'error', text: err.response?.data?.error || "Failed to save settings." });
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">Loading trigger configurations...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 p-6">
      <header className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Send className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Trigger Management</h1>
        </div>
        <p className="text-muted-foreground">Configure which servers and routes handle automated system emails.</p>
      </header>

      {message && (
        <div className={`p-4 rounded-xl flex items-center gap-3 border animate-in slide-in-from-top duration-300 ${
          message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' : 'bg-red-500/10 border-red-500/20 text-red-600'
        }`}>
          {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span className="text-sm font-medium">{message.text}</span>
        </div>
      )}

      <div className="grid gap-6">
        {TRIGGER_TYPES.map((type) => {
          const currentSetting = settings[type.id];
          const pending = pendingSelections[type.id];
          
          const selectedSenderId = pending?.senderId || currentSetting?.senderId?._id || currentSetting?.senderId || "";
          const selectedRouteId = pending ? pending.routeId : (currentSetting?.routeId || "");
          
          const selectedSender = senders.find(s => s._id === selectedSenderId);
          const availableRoutes = selectedSender?.routes || [];

          return (
            <div key={type.id} className="group relative rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
               {/* Accent Line */}
               <div className="absolute top-0 left-0 w-1 h-full bg-primary/20 group-hover:bg-primary transition-colors" />

               <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                  <div className="space-y-1 flex-1">
                    <h3 className="text-lg font-bold text-fg flex items-center gap-2">
                      {type.label}
                      {currentSetting && (
                        <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 bg-emerald-500/10 text-emerald-600 rounded-full border border-emerald-500/20">
                          Active
                        </span>
                      )}
                    </h3>
                    <p className="text-sm text-muted-foreground">{type.description}</p>
                    
                    {currentSetting && (
                      <div className="mt-4 flex flex-wrap gap-3">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/40 border border-border text-xs">
                          <Server size={12} className="text-primary" />
                          <span className="font-medium text-muted-foreground">Server:</span>
                          <span className="text-fg">{currentSetting.senderId?.name || "None"}</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/40 border border-border text-xs">
                          <Send size={12} className="text-primary" />
                          <span className="font-medium text-muted-foreground">Route:</span>
                          <span className="text-fg">{currentSetting.routeName || "None"}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-4 min-w-[280px]">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Select Sender</label>
                      <select
                        value={selectedSenderId}
                        onChange={(e) => handleUpdate(type.id, e.target.value, "")}
                        className="w-full h-11 px-4 rounded-xl bg-muted/30 border border-border focus:ring-2 focus:ring-primary/20 transition-all text-sm outline-none"
                      >
                        <option value="">Select a server...</option>
                        {senders.map(s => (
                          <option key={s._id} value={s._id}>{s.name} ({s.code})</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Select Route</label>
                      <select
                        value={selectedRouteId}
                        disabled={!selectedSenderId}
                        onChange={(e) => handleUpdate(type.id, selectedSenderId, e.target.value)}
                        className="w-full h-11 px-4 rounded-xl bg-muted/30 border border-border focus:ring-2 focus:ring-primary/20 transition-all text-sm outline-none disabled:opacity-50"
                      >
                        <option value="">Select a route...</option>
                        {availableRoutes.map(r => (
                          <option key={r._id} value={r._id}>{r.vmta} - {r.domain}</option>
                        ))}
                      </select>
                    </div>
                  </div>
               </div>

               {saving === type.id && (
                 <div className="absolute inset-0 bg-bg/40 backdrop-blur-[1px] flex items-center justify-center z-10">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                 </div>
               )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
