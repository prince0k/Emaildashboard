"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Send, Key, Search, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/lib/authContext";

type Permission = {
  _id: string;
  name: string;
  module: string;
  description?: string;
};

export default function RequestAccessPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const isAdmin = user?.permissions?.includes("admin.roles");

  useEffect(() => {
    if (isAdmin) {
      router.push("/");
    }
  }, [isAdmin, router]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    const fetchPerms = async () => {
      try {
        const res = await api.get("/permissions");
        setPermissions(res.data.permissions || []);
      } catch (err) {
        console.error("Failed to load permissions", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPerms();
  }, []);

  const handleRequest = async (permissionId: string) => {
    const reason = prompt("Why do you need this permission?");
    if (reason === null) return;

    try {
      setSubmitting(permissionId);
      setMessage(null);
      await api.post("/permission-requests/request", {
        permissionId,
        reason
      });
      setMessage({ type: 'success', text: "Request submitted! Admin will review it shortly." });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.error || "Failed to submit request." });
    } finally {
      setSubmitting(null);
    }
  };

  const filteredPerms = permissions.filter(p => 
    !user?.permissions?.includes(p.name) &&
    (p.name.toLowerCase().includes(search.toLowerCase()) || 
     p.module.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Fetching available permissions...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-6">
      <header className="space-y-2 text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mx-auto mb-4">
          <Key className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Request Access</h1>
        <p className="text-muted-foreground">Need a permission you don't have? Select it from the list below to request it from an Admin.</p>
      </header>

      {message && (
        <div className={`p-4 rounded-xl flex items-center gap-3 border animate-in fade-in zoom-in duration-300 ${
          message.type === 'success' ? 'bg-emerald/10 border-emerald/20 text-emerald' : 'bg-rose/10 border-rose/20 text-rose'
        }`}>
          {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span className="text-sm font-medium">{message.text}</span>
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
        <input 
          type="text"
          placeholder="Search by permission name or module (e.g. sender, campaign)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-14 pl-12 pr-4 rounded-2xl bg-muted/40 border border-border focus:ring-2 focus:ring-primary/20 transition-all outline-none text-lg"
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {filteredPerms.map((perm) => (
          <div key={perm._id} className="group p-5 rounded-2xl border border-border bg-card hover:border-primary/30 transition-all flex flex-col justify-between">
            <div className="space-y-1">
               <div className="text-[10px] uppercase tracking-widest font-bold text-primary mb-1">{perm.module}</div>
               <div className="font-bold text-foreground">{perm.name}</div>
               <p className="text-xs text-muted-foreground line-clamp-2">{perm.description || "No description provided."}</p>
            </div>
            
            <button
              onClick={() => handleRequest(perm._id)}
              disabled={submitting === perm._id}
              className="mt-6 w-full h-10 rounded-xl bg-muted hover:bg-primary hover:text-primary-foreground text-sm font-semibold transition-all flex items-center justify-center gap-2 group-hover:bg-primary/5 group-hover:text-primary"
            >
              {submitting === perm._id ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              Request Access
            </button>
          </div>
        ))}
        
        {filteredPerms.length === 0 && search && (
          <div className="col-span-full text-center py-10 text-muted-foreground">
            No unassigned permissions matching "{search}"
          </div>
        )}
      </div>
    </div>
  );
}
