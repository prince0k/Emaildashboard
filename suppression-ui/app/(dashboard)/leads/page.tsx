"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { 
  Users, 
  Mail, 
  CheckCircle2, 
  XCircle, 
  Globe, 
  Calendar, 
  RefreshCw,
  Search
} from "lucide-react";
import StatusBadge from "@/components/StatusBadge";

export default function LeadsDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    to: new Date().toISOString().split("T")[0],
  });

  async function fetchStats() {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get("/leads/stats", {
        params: dateRange
      });
      setStats(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.error || "Failed to load lead stats");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card/80 backdrop-blur-sm border border-border/60 rounded-2xl p-6 shadow-soft">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <Users size={18} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Website Leads</h1>
          </div>
          <p className="text-muted-foreground text-sm">
            Monitor real-time subscription leads and welcome email triggers
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-background border border-border/60 rounded-xl px-3 py-2">
            <Calendar size={16} className="text-muted-foreground" />
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
              className="bg-transparent border-none focus:ring-0 text-sm p-0 w-28"
            />
            <span className="text-muted-foreground text-xs">to</span>
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
              className="bg-transparent border-none focus:ring-0 text-sm p-0 w-28"
            />
          </div>

          <button
            onClick={fetchStats}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
          >
             <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {stats && (
        <>
          {/* STATS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard 
              label="Total New Leads" 
              value={stats.totalLeads} 
              icon={<Users size={20} />} 
              color="text-primary"
            />
            <StatCard 
              label="Triggers Sent" 
              value={stats.statusCounts?.SENT || 0} 
              icon={<CheckCircle2 size={20} />} 
              color="text-emerald-500"
            />
            <StatCard 
              label="Failed Triggers" 
              value={stats.statusCounts?.FAILED || 0} 
              icon={<XCircle size={20} />} 
              color="text-red-500"
            />
            <StatCard 
              label="Active Sources" 
              value={stats.siteCounts?.length || 0} 
              icon={<Globe size={20} />} 
              color="text-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* SOURCE BREAKDOWN */}
            <div className="bg-card/80 backdrop-blur-sm border border-border/60 rounded-2xl p-6 shadow-soft h-fit">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-6">Leads by Source</h3>
              <div className="space-y-4">
                {stats.siteCounts.map((site: any) => (
                  <div key={site._id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <span className="text-sm font-medium">{site._id || "Unknown"}</span>
                    </div>
                    <span className="text-sm font-bold">{site.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* RECENT LEADS TABLE */}
            <div className="lg:col-span-2 bg-card/80 backdrop-blur-sm border border-border/60 rounded-2xl overflow-hidden shadow-soft transition hover:shadow-medium">
              <div className="p-6 border-b border-border/60 flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Recent Activity</h3>
                <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded font-bold uppercase">Latest 50</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead>
                    <tr className="bg-muted/40 text-[11px] uppercase font-bold text-muted-foreground/70 tracking-widest">
                      <th className="px-6 py-4">Time</th>
                      <th className="px-6 py-4">Lead Info</th>
                      <th className="px-6 py-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {stats.recentLeads.map((lead: any) => (
                      <tr key={lead._id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4 text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(lead.createdAt).toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-foreground">{lead.email}</div>
                          <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-2">
                             <span className="font-bold text-primary/80 uppercase">{lead.siteName}</span>
                             <span>•</span>
                             <span>{lead.route}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            lead.status === "SENT" ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
                          }`}>
                            {lead.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {loading && !stats && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 size={40} className="text-primary animate-spin" />
          <p className="text-muted-foreground animate-pulse">Analyzing lead data...</p>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: number | string; icon: React.ReactNode; color: string }) {
  return (
    <div className="bg-card/80 backdrop-blur-sm border border-border/60 rounded-2xl p-6 shadow-soft hover:shadow-medium transition group">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2.5 rounded-xl bg-muted/50 border border-border/60 group-hover:scale-110 transition duration-300 ${color}`}>
          {icon}
        </div>
      </div>
      <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-2 text-3xl font-bold tracking-tight">
        {value?.toLocaleString()}
      </div>
    </div>
  );
}

function Loader2(props: any) {
  return <RefreshCw {...props} />;
}
