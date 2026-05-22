"use client";

import { useState, useEffect, Suspense } from "react";
import api from "@/lib/api";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Mail, Server, Target, FileText, Send, ChevronRight, AlertCircle, CheckCircle2 } from "lucide-react";

export default function CreateTriggerPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center text-text-secondary">Loading...</div>}>
      <TriggerForm />
    </Suspense>
  );
}

function TriggerForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const parentIdParam = searchParams.get("parentId");
  
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [servers, setServers] = useState<any[]>([]);
  const [offers, setOffers] = useState<any[]>([]);
  const [creatives, setCreatives] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [fromLines, setFromLines] = useState<any[]>([]);
  
  const [form, setForm] = useState({
    parentCampaignId: "",
    triggerType: "OPEN",
    senderId: "",
    routeId: "",
    offerId: "",
    creativeId: "",
    subjectIds: [] as string[],
    fromIds: [] as string[],
    isp: "comcast",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function loadInitial() {
      try {
        const [campRes, servRes, offRes] = await Promise.all([
          api.get("/campaigns"),
          api.get("/senders", { params: { active: true } }),
          api.get("/offers"),
        ]);
        
        const campaignsData = Array.isArray(campRes.data) ? campRes.data : (campRes.data?.data || campRes.data?.campaigns || []);
        setCampaigns(campaignsData);
        setServers(servRes.data?.senders || []);
        setOffers(offRes.data || []);
      } catch (err) {
        setError("Failed to load initial configuration.");
      }
    }
    loadInitial();
  }, []);

  useEffect(() => {
    if (parentIdParam && campaigns.length > 0) {
      const match = campaigns.find(c => c._id === parentIdParam || c.campaignName === parentIdParam);
      if (match) {
        setForm(prev => ({ ...prev, parentCampaignId: match._id }));
      }
    }
  }, [parentIdParam, campaigns]);

  useEffect(() => {
    if (!form.offerId) {
      setCreatives([]);
      setSubjects([]);
      setFromLines([]);
      return;
    }
    async function loadOfferAssets() {
      try {
        const [creRes, subRes, fromRes] = await Promise.all([
          api.get("/offers/creatives/list", { params: { offerId: form.offerId } }),
          api.get("/offers/subject-lines/list", { params: { offerId: form.offerId } }),
          api.get("/offers/from-lines/list", { params: { offerId: form.offerId } }),
        ]);
        setCreatives(creRes.data || []);
        setSubjects(subRes.data || []);
        setFromLines(fromRes.data || []);
      } catch {
        setError("Failed to load offer assets.");
      }
    }
    loadOfferAssets();
  }, [form.offerId]);

  const handleSubmit = async () => {
    if (!form.parentCampaignId || !form.senderId || !form.routeId || !form.offerId || !form.creativeId) {
      setError("Please fill all required fields.");
      return;
    }

    setLoading(true);
    setError("");
    
    try {
      await api.post("/campaign-triggers", form);
      setSuccess(true);
      setTimeout(() => router.push("/campaigns/triggers"), 2000);
    } catch (err: any) {
      setError(err?.response?.data?.error || "Failed to create trigger.");
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (id: string, field: "subjectIds" | "fromIds") => {
    setForm(prev => ({
      ...prev,
      [field]: prev[field].includes(id) 
        ? prev[field].filter(x => x !== id) 
        : [...prev[field], id]
    }));
  };

  const selectedServer = servers.find(s => s._id === form.senderId);

  return (
    <div className="min-h-screen bg-background p-8 pb-32">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header Area */}
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-primary font-mono text-xs uppercase tracking-widest">
              <Zap size={14} /> Automation Workflow
            </div>
            <h1 className="text-4xl font-bold text-foreground tracking-tight">Create Trigger Campaign</h1>
            <p className="text-text-secondary text-lg">Define automated follow-up rules for your leads.</p>
          </div>
          
          <div className="flex items-center gap-3">
             <button 
              onClick={() => router.back()}
              className="px-6 py-3 rounded-2xl bg-panel border border-border text-text-secondary font-medium hover:bg-hover hover:text-foreground transition cursor-pointer"
            >
              Cancel
            </button>
            <button 
              onClick={handleSubmit}
              disabled={loading}
              className="px-8 py-3 rounded-2xl bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              {loading ? "Saving..." : "Create Trigger"} <Send size={18} />
            </button>
          </div>
        </div>

        {error && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-rose/10 border border-rose/20 p-4 rounded-2xl flex items-center gap-3 text-rose">
            <AlertCircle size={20} /> {error}
          </motion.div>
        )}

        {success && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-emerald/10 border border-emerald/20 p-4 rounded-2xl flex items-center gap-3 text-emerald">
            <CheckCircle2 size={20} /> Trigger campaign created successfully! Redirecting...
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT COL: SOURCE & SENDER */}
          <div className="space-y-8 lg:col-span-1">
            <div className="bg-card/40 backdrop-blur-xl border border-border/50 p-6 rounded-3xl space-y-6">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Target size={20} className="text-primary" /> 1. Source & Trigger
              </h2>
              
              <Select 
                label="Select Parent Campaign" 
                value={form.parentCampaignId} 
                onChange={v => setForm({...form, parentCampaignId: v})}
                options={campaigns.map(c => ({ value: c._id, label: c.campaignName }))}
              />

              <Select 
                label="Trigger Type" 
                value={form.triggerType} 
                onChange={v => setForm({...form, triggerType: v})}
                options={[{ value: "OPEN", label: "On Lead Open" }, { value: "CLICK", label: "On Link Click" }]}
              />
            </div>

            <div className="bg-card/40 backdrop-blur-xl border border-border/50 p-6 rounded-3xl space-y-6">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Server size={20} className="text-cyan" /> 2. Delivery Setup
              </h2>
              
              <Select 
                label="Sender Server" 
                value={form.senderId} 
                onChange={v => setForm({...form, senderId: v, routeId: ""})}
                options={servers.map(s => ({ value: s._id, label: s.name }))}
              />

              <Select 
                label="Route (IP/Domain)" 
                value={form.routeId} 
                onChange={v => setForm({...form, routeId: v})}
                options={(selectedServer?.routes || [])
                  .filter((r: any) => r.active !== false)
                  .map((r: any) => ({ value: r._id, label: `${r.vmta} | ${r.domain}` }))}
              />

              <Select 
                label="ISP Config" 
                value={form.isp} 
                onChange={v => setForm({...form, isp: v})}
                options={[
                  { value: "comcast", label: "Comcast" },
                  { value: "gmail", label: "Gmail" },
                  { value: "yahoo", label: "Yahoo" },
                  { value: "mixed", label: "Mixed Mode" }
                ]}
              />
            </div>
          </div>

          {/* RIGHT COL: OFFER & CONTENT */}
          <div className="space-y-8 lg:col-span-2">
            <div className="bg-card/40 backdrop-blur-xl border border-border/50 p-6 rounded-3xl space-y-6">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <FileText size={20} className="text-violet" /> 3. Campaign Content
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <Select 
                    label="Offer" 
                    value={form.offerId} 
                    onChange={v => setForm({...form, offerId: v, creativeId: "", subjectIds: [], fromIds: []})}
                    options={offers.map(o => ({ value: o._id, label: `${o.cid} | ${o.offer}` }))}
                  />

                  <Select 
                    label="Creative Template" 
                    value={form.creativeId} 
                    onChange={v => setForm({...form, creativeId: v})}
                    options={creatives.map(c => ({ value: c._id, label: c.name || c.creativeName }))}
                  />
                </div>

                <div className="space-y-4">
                  <label className="text-xs font-bold text-text-secondary uppercase tracking-widest ml-1">Subject Lines (Rotation)</label>
                  <div className="bg-panel/60 border border-border rounded-2xl p-4 h-[120px] overflow-y-auto space-y-2 scrollbar-hide">
                    {subjects.length === 0 ? (
                      <div className="text-center py-6 text-text-muted text-xs italic">Select an offer first</div>
                    ) : (
                      subjects.map(s => (
                        <div 
                          key={s._id} 
                          onClick={() => toggleSelection(s._id, "subjectIds")}
                          className={`p-2 rounded-xl text-xs cursor-pointer transition ${form.subjectIds.includes(s._id) ? "bg-primary/10 text-primary border border-primary/20" : "hover:bg-hover text-text-secondary border border-transparent"}`}
                        >
                          {s.text}
                        </div>
                      ))
                    )}
                  </div>

                  <label className="text-xs font-bold text-text-secondary uppercase tracking-widest ml-1">From Lines (Rotation)</label>
                  <div className="bg-panel/60 border border-border rounded-2xl p-4 h-[120px] overflow-y-auto space-y-2 scrollbar-hide">
                    {fromLines.length === 0 ? (
                      <div className="text-center py-6 text-text-muted text-xs italic">Select an offer first</div>
                    ) : (
                      fromLines.map(f => (
                        <div 
                          key={f._id} 
                          onClick={() => toggleSelection(f._id, "fromIds")}
                          className={`p-2 rounded-xl text-xs cursor-pointer transition ${form.fromIds.includes(f._id) ? "bg-cyan/10 text-cyan border border-cyan/20" : "hover:bg-hover text-text-secondary border border-transparent"}`}
                        >
                          {f.text}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* TESTING SECTION */}
            <div className="bg-gradient-to-br from-amber/5 to-amber/10 border border-amber/20 p-8 rounded-3xl space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-amber/10 p-2 rounded-xl text-amber"><Zap size={20} /></div>
                  <h2 className="text-xl font-bold text-foreground">Manual Verification</h2>
                </div>
              </div>
              <p className="text-text-secondary">Instantly test this trigger by sending a follow-up mail to a specific address.</p>
              
              <div className="flex gap-4">
                <input 
                  type="email" 
                  placeholder="Test email address (e.g. your@email.com)"
                  className="flex-1 bg-card border border-amber/20 rounded-2xl px-5 py-4 text-foreground focus:ring-2 focus:ring-amber outline-none transition"
                  id="testEmail"
                />
                <button
                  onClick={async () => {
                    const email = (document.getElementById("testEmail") as HTMLInputElement).value;
                    if (!email) return alert("Please enter a test email.");
                    try {
                      await api.post("/campaign-triggers/test", { ...form, email });
                      alert("Test fired! Check your inbox.");
                    } catch (err: any) {
                      alert(err?.response?.data?.error || "Test failed");
                    }
                  }}
                  className="px-8 py-4 rounded-2xl bg-amber text-white font-bold hover:bg-amber/90 transition-all shadow-lg shadow-amber/10 cursor-pointer"
                >
                  Fire Test Now
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Select({ label, value, onChange, options }: { label: string, value: string, onChange: (v: string) => void, options: any[] }) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-bold text-text-secondary uppercase tracking-widest ml-1">{label}</label>
      <div className="relative">
        <select 
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-card border border-border rounded-2xl px-4 py-4 text-sm text-foreground focus:ring-2 focus:ring-primary/50 outline-none transition-all appearance-none cursor-pointer"
        >
          <option value="" className="bg-card text-foreground">Select {label}...</option>
          {options.map(o => (
            <option key={o.value} value={o.value} className="bg-card text-foreground">{o.label}</option>
          ))}
        </select>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-text-secondary">
          <ChevronRight size={16} className="rotate-90" />
        </div>
      </div>
    </div>
  );
}
