"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, Plus, Trash2, Loader2, Mail } from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";
import api from "@/lib/api";

export default function TestIdsPage() {
  const [testIds, setTestIds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newLabel, setNewLabel] = useState("");

  const loadTestIds = async () => {
    try {
      setLoading(true);
      const res = await api.get("/test-ids");
      setTestIds(res.data.testIds);
    } catch (err) {
      console.error("Test IDs load failed", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail) return;
    setAdding(true);
    try {
      await api.post("/test-ids", { email: newEmail, label: newLabel });
      setNewEmail("");
      setNewLabel("");
      loadTestIds();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to add test ID");
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this authorized test ID?")) return;
    try {
      await api.delete(`/test-ids/${id}`);
      loadTestIds();
    } catch (err) {
      alert("Failed to delete");
    }
  };

  useEffect(() => {
    loadTestIds();
  }, []);

  return (
    <ProtectedRoute permission="role.view">
      <div className="space-y-8 max-w-5xl mx-auto px-4 py-10 font-sans">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-secondary/20 p-8 rounded-3xl border border-border/40 backdrop-blur-xl shadow-inner">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/30">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Authorized Test IDs</h1>
              <p className="text-sm text-muted-foreground mt-1 font-medium opacity-70 italic">
                Only these emails are permitted to receive Safety Fire Tests.
              </p>
            </div>
          </div>
          <div className="bg-background/40 px-5 py-2.5 rounded-xl border border-border/20 text-xs font-bold uppercase tracking-widest text-primary">
            Security Protocol Active
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Add Form */}
          <div className="lg:col-span-4">
            <div className="bg-card border border-border shadow-sm rounded-3xl p-6 sticky top-8">
              <h3 className="text-lg font-bold flex items-center gap-2 mb-6">
                <Plus className="w-5 h-5 text-primary" /> Authorize New ID
              </h3>
              <form onSubmit={handleAdd} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Email Address</label>
                  <input 
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="tester@gmail.com"
                    className="w-full bg-secondary/20 border border-border/40 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Label / Owner</label>
                  <input 
                    type="text"
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    placeholder="Global Test ID"
                    className="w-full bg-secondary/20 border border-border/40 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <button 
                  type="submit"
                  disabled={adding}
                  className="w-full bg-primary text-primary-foreground font-bold py-3.5 rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                >
                  {adding ? <Loader2 className="w-5 h-5 animate-spin" /> : <><ShieldCheck className="w-5 h-5" /> AUTHORIZE ID</>}
                </button>
              </form>
            </div>
          </div>

          {/* List Table */}
          <div className="lg:col-span-8">
            <div className="bg-card border border-border shadow-sm rounded-3xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-secondary/10 border-b border-border/20">
                      <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Authorized Email</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Description</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Added</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/20">
                    {loading ? (
                      [...Array(3)].map((_, i) => (
                        <tr key={i} className="animate-pulse">
                          <td colSpan={4} className="px-6 py-6"><div className="h-4 bg-muted/20 rounded w-full" /></td>
                        </tr>
                      ))
                    ) : testIds.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground italic opacity-60">
                          No authorized test IDs found. Safety Fire tests are currently disabled.
                        </td>
                      </tr>
                    ) : (
                      testIds.map((id) => (
                        <tr key={id._id} className="hover:bg-secondary/5 transition-all group">
                          <td className="px-6 py-5 font-bold text-[15px] flex items-center gap-3">
                            <Mail className="w-4 h-4 text-primary opacity-40" />
                            {id.email}
                          </td>
                          <td className="px-6 py-5 text-sm text-muted-foreground font-medium">{id.label}</td>
                          <td className="px-6 py-5 text-xs text-muted-foreground font-bold opacity-40">
                            {new Date(id.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-5 text-right">
                            <button 
                              onClick={() => handleDelete(id._id)}
                              className="p-2.5 rounded-xl text-destructive hover:bg-destructive/10 transition-all opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
