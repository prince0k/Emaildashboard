"use client";

import { useEffect, useState, Fragment } from "react";
import {
  History,
  Filter,
  Search,
  RefreshCw,
  Play,
  StopCircle,
  Clock,
  CheckCircle,
  AlertCircle,
  Download,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import api from "@/lib/api";
import StatsCard from "@/components/StatsCard";

export const dynamic = "force-dynamic";

export default function DeployHistoryPage() {
  const [offers, setOffers] = useState([]);
  const [rows, setRows] = useState([]);
  const [selectedSid, setSelectedSid] = useState("");
  const [loading, setLoading] = useState(false);
  const [actionId, setActionId] = useState(null);
  const [msg, setMsg] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [expandedRows, setExpandedRows] = useState({});
  const [copiedId, setCopiedId] = useState(null);

  /* ================= LOAD OFFERS ================= */
  useEffect(() => {
    api
      .get("/offers")
      .then((res) => setOffers(Array.isArray(res.data) ? res.data : []))
      .catch(() => setMsg("Failed to load offers"));
  }, []);

  /* ================= LOAD HISTORY ================= */
  const fetchHistory = async (sid = "") => {
  setLoading(true);
  setMsg("");

  try {
    const res = await api.get("/deployhistory", {
      params: sid ? { sid } : {},
    });

    setRows(Array.isArray(res.data?.history) ? res.data.history : []);
  } catch (err) {
    console.error(err);
    setRows([]);
    setMsg("Failed to load deploy history");
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchHistory();
  }, []);

  /* ================= ACTIONS ================= */
  const undeploy = async (row) => {
    if (actionId === row.offer_id) return;
    if (!confirm(`Undeploy "${row.offer_id}"?`)) return;

    setActionId(row.offer_id);

    try {
      await api.post("/undeployoffer", { offer_id: row.offer_id });
      fetchHistory(selectedSid);
    } catch {
      setMsg("Undeploy failed");
    } finally {
      setActionId(null);
    }
  };

  const redeploy = async (row) => {
    if (actionId === row.offer_id) return;
    if (!confirm(`Redeploy "${row.offer_id}"?`)) return;

    setActionId(row.offer_id);

    try {
      await api.post("/redeployoffer", { offer_id: row.offer_id });
      fetchHistory(selectedSid);
    } catch {
      setMsg("Redeploy failed");
    } finally {
      setActionId(null);
    }
  };

  /* ================= FILTER ================= */
  const filtered = rows.filter((r) => {
    if (
      searchTerm &&
      !r.offer_id?.toLowerCase().includes(searchTerm.toLowerCase())
    )
      return false;

    if (filterStatus !== "all" && r.status !== filterStatus) return false;

    return true;
  });

  /* ================= STATS ================= */
  const stats = {
    total: filtered.length,
    deployed: filtered.filter((r) => r.status === "DEPLOYED").length,
    undeployed: filtered.filter((r) => r.status === "UNDEPLOYED").length,
    other: filtered.filter(
      (r) => !["DEPLOYED", "UNDEPLOYED"].includes(r.status)
    ).length,
  };

  const calcDuration = (start, end) => {
  if (!start) return "—";
  const s = new Date(start);
  const e = end ? new Date(end) : new Date();
  const diff = e - s;

  const h = Math.floor(diff / 36e5);
  const m = Math.floor((diff % 36e5) / 6e4);

  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};


  /* ================= UI ================= */
  return (
    <div className="min-h-screen bg-background p-6 text-foreground">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Deployment History</h1>
          <p className="text-sm text-muted-foreground">
            Track deploy / undeploy lifecycle
          </p>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatsCard label="Total" value={stats.total} icon={History} />
          <StatsCard
            label="Deployed"
            value={stats.deployed}
            icon={CheckCircle}
            color="text-green-400"
          />
          <StatsCard
            label="Undeployed"
            value={stats.undeployed}
            icon={StopCircle}
          />
          <StatsCard
            label="Other"
            value={stats.other}
            icon={AlertCircle}
            color="text-yellow-400"
          />
        </div>

        {/* FILTER */}
        {/* FILTER */}
<div className="rounded-lg border border-border bg-card p-4 flex gap-3">
  <select
    value={selectedSid}
    onChange={(e) => {
      setSelectedSid(e.target.value);
      fetchHistory(e.target.value);
    }}
    className="bg-background border border-border px-3 py-2 rounded text-sm"
  >
    <option value="">All Offers</option>
    {offers.map(o => (
      <option key={o.sid} value={o.sid}>
        {o.sponsor} | {o.cid}
      </option>
    ))}
  </select>

  <input
    placeholder="Search offer id"
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
    className="bg-background border border-border px-3 py-2 rounded text-sm w-full"
  />

  <select
    value={filterStatus}
    onChange={(e) => setFilterStatus(e.target.value)}
    className="bg-background border border-border px-3 py-2 rounded text-sm"
  >
    <option value="all">All</option>
    <option value="DEPLOYED">Deployed</option>
    <option value="UNDEPLOYED">Undeployed</option>
  </select>

  <button
    onClick={() => fetchHistory(selectedSid)}
    className="bg-blue-600 px-4 py-2 rounded text-sm"
  >
    Refresh
  </button>
</div>


        {/* TABLE */}
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          {loading ? (
            <div className="p-6 text-muted-foreground">Loading…</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-background text-muted-foreground">
                <tr>
                  <th className="p-3 text-left">Offer ID</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Duration</th>
                  <th className="p-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr
                    key={row._id}
                    className="border-t border-border"
                  >
                    <td className="p-3">
  <span className="font-mono text-xs px-2 py-1 rounded bg-muted text-foreground">
    {row.offer_id}
  </span>
</td>
                    <td className="p-3">
  {row.status === "DEPLOYED" ? (
    <span className="text-green-400">DEPLOYED</span>
  ) : (
    <span className="text-muted-foreground">UNDEPLOYED</span>
  )}
</td>

                    <td className="p-3">
  <Clock size={14} className="inline mr-1" />
  {calcDuration(row.deployedAt, row.undeployedAt)}
</td>

                    <td className="p-3 flex gap-2">
                      {row.status === "DEPLOYED" && (
                        <button
                          onClick={() => undeploy(row)}
                          className="text-destructive text-xs"
                        >
                          Undeploy
                        </button>
                      )}
                      {row.status === "UNDEPLOYED" && (
                        <button
                          onClick={() => redeploy(row)}
                          className="text-green-400 text-xs"
                        >
                          Redeploy
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {msg && <div className="text-destructive">{msg}</div>}
      </div>
    </div>
  );
}
