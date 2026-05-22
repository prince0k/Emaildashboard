"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Zap, Target, Mail, Server } from "lucide-react";

export default function TriggersListPage() {
  const [triggers, setTriggers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTriggers();
  }, []);

  async function loadTriggers() {
    try {
      const res = await api.get("/campaign-triggers");
      setTriggers(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this trigger?")) return;
    try {
      await api.delete(`/campaign-triggers/${id}`);
      setTriggers(triggers.filter(t => t._id !== id));
    } catch (err) {
      alert("Delete failed");
    }
  }

  return (
    <div className="min-h-screen bg-background p-8 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Campaign Triggers</h1>
          <p className="text-text-secondary mt-1">Manage automated follow-up workflows</p>
        </div>
        <Link href="/campaigns/triggers/create">
          <button className="flex items-center gap-2 bg-primary px-6 py-3 rounded-2xl text-primary-foreground font-semibold hover:bg-primary/90 transition shadow-lg shadow-primary/20 cursor-pointer">
            <Plus size={20} />
            Create Trigger
          </button>
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-20 text-text-muted">Loading triggers...</div>
      ) : triggers.length === 0 ? (
        <div className="bg-card border border-dashed border-border/40 rounded-3xl p-20 text-center space-y-4">
          <div className="bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto text-primary">
            <Zap size={32} />
          </div>
          <h3 className="text-xl font-medium text-foreground">No triggers active</h3>
          <p className="text-text-secondary max-w-sm mx-auto">Create your first trigger to automate follow-up emails based on user engagement.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {triggers.map((trigger, idx) => (
              <motion.div
                key={trigger._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-card border border-border rounded-3xl p-6 space-y-6 hover:border-primary/40 transition-colors group"
              >
                <div className="flex justify-between items-start">
                  <div className="bg-primary/10 p-3 rounded-2xl text-primary">
                    <Zap size={24} />
                  </div>
                  <button 
                    onClick={() => handleDelete(trigger._id)}
                    className="p-2 text-text-muted hover:text-rose hover:bg-rose/10 rounded-xl transition-colors cursor-pointer"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="text-xs font-semibold text-primary uppercase tracking-widest mb-1 flex items-center gap-2">
                      <Target size={12} /> Parent Campaign
                    </div>
                    <div className="text-lg font-medium text-foreground line-clamp-1">{trigger.parentCampaignId?.campaignName || "Unknown"}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-panel/50 p-3 rounded-2xl border border-border">
                      <div className="text-[10px] font-bold text-text-muted uppercase mb-1 flex items-center gap-1">
                        <Server size={10} /> Route
                      </div>
                      <div className="text-sm font-medium text-text-secondary truncate">{trigger.routeName || "Default"}</div>
                    </div>
                    <div className="bg-panel/50 p-3 rounded-2xl border border-border">
                      <div className="text-[10px] font-bold text-text-muted uppercase mb-1 flex items-center gap-1">
                        <Mail size={10} /> ISP
                      </div>
                      <div className="text-sm font-medium text-text-secondary uppercase">{trigger.isp}</div>
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-semibold text-cyan uppercase tracking-widest mb-1">Follow-up Offer</div>
                    <div className="text-sm text-foreground font-medium bg-cyan/10 border border-cyan/20 p-3 rounded-2xl">
                      {trigger.offerId?.cid} | {trigger.offerId?.offer}
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <span className="text-[10px] font-bold bg-emerald/10 text-emerald px-2 py-1 rounded-lg">ACTIVE</span>
                  <span className="text-[10px] font-medium text-text-muted">Type: {trigger.triggerType}</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
