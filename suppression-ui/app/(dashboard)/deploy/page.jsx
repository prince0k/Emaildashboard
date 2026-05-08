"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Upload,
  History,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Activity,
} from "lucide-react";
import api from "@/lib/api";

/* ================== STATS CARD ================== */
function StatsCard({ label, value, icon: Icon, color }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5 flex items-center justify-between">
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`text-2xl font-semibold mt-1 ${color}`}>{value}</p>
      </div>
      <div className="p-3 rounded-md bg-background border border-border">
        <Icon size={22} className={color} />
      </div>
    </div>
  );
}

/* ================== MAIN ================== */
export default function DeployPage() {
  const [offers, setOffers] = useState([]);
  const [sid, setSid] = useState("");
  const [offer, setOffer] = useState(null);

  const [runtimeId, setRuntimeId] = useState("");
  const [history, setHistory] = useState([]);

  const [loading, setLoading] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [msg, setMsg] = useState("");

  const [showHistory, setShowHistory] = useState(false);

  /* ---------- LOAD OFFERS ---------- */
  useEffect(() => {
    api.get("/offers")
      .then(r => setOffers(r.data || []))
      .catch(() => setMsg("Failed to load offers"));
  }, []);

  /* ---------- SELECT OFFER ---------- */
  const onSelect = e => {
    const s = e.target.value;
    setSid(s);
    setRuntimeId("");
    setHistory([]);
    setMsg("");
    setShowHistory(false);
    setOffer(offers.find(o => o.sid === s) || null);
  };

  /* ---------- LOAD HISTORY ---------- */
  const loadHistory = async (silent = false) => {
    if (!sid) return;
    if (!silent) setLoading(true);

    try {
      const r = await api.get("/deployhistory", { params: { sid } });
      setHistory(Array.isArray(r.data.history) ? r.data.history : []);
    } catch {
      setMsg("Failed to load history");
    }

    if (!silent) setLoading(false);
  };

  /* ---------- AUTO REFRESH ---------- */
  useEffect(() => {
    if (!showHistory) return;
    loadHistory(true);

    const t = setInterval(() => loadHistory(true), 5000);
    return () => clearInterval(t);
  }, [showHistory, sid]);

  /* ---------- DEPLOY (OPTIMISTIC) ---------- */
  const deploy = async () => {
    if (!offer || !runtimeId.trim()) return;

    setDeploying(true);
    setMsg("");

    // optimistic insert
    const optimistic = {
      _id: "optimistic",
      offer_id: runtimeId,
      status: "DEPLOYING",
      deployedAt: new Date().toISOString(),
    };
    setHistory(h => [optimistic, ...h]);

    try {
      console.log({
  sid: offer?.sid,
  offer_id: runtimeId.trim(),
});
      await api.post("/deployoffer", {
        sid: offer.sid,
        offer_id: runtimeId.trim(),
      });

      setMsg("Offer deployed successfully");
      setRuntimeId("");
      await loadHistory(true);
    } catch (err) {
  const message =
    err?.response?.data?.error ||
    err?.response?.data?.message ||
    err?.message ||
    "Deploy failed";

  setMsg(message);
  setHistory(h => h.filter(x => x._id !== "optimistic"));
}

    setDeploying(false);
  };

  const deployedCount = useMemo(
    () => history.filter(h => h.status === "DEPLOYED").length,
    [history]
  );

  /* ================== UI ================== */
  return (
    <div className="space-y-12 max-w-6xl">
      {/* HEADER */}
      <div>
        <h1 className="text-xl font-semibold">Deploy Offers</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Deploy offers into runtime environment
        </p>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard
          label="Available Offers"
          value={offers.length}
          icon={Activity}
          color="text-blue-400"
        />
        <StatsCard
          label="Deployed"
          value={deployedCount}
          icon={CheckCircle}
          color="text-green-400"
        />
        <StatsCard
          label="History"
          value={history.length}
          icon={History}
          color="text-purple-400"
        />
        <StatsCard
          label="Status"
          value={deploying ? "Deploying…" : "Ready"}
          icon={RefreshCw}
          color="text-yellow-400"
        />
      </div>

      {/* MESSAGE */}
      {msg && (
        <div className="text-sm text-red-400">{msg}</div>
      )}

      {/* CARD */}
      <div className="rounded-lg border border-border bg-card p-6 space-y-5">
        <select
          className="w-full bg-background border border-border rounded-md p-2 text-sm"
          value={sid}
          onChange={onSelect}
        >
          <option value="">Select Offer</option>
          {offers.map(o => (
            <option key={o.sid} value={o.sid}>
              {o.sponsor} | {o.cid} | {o.offer}
            </option>
          ))}
        </select>

        {offer && (
          <>
            <input
              className="w-full bg-background border border-border rounded-md p-2 text-sm"
              placeholder="Runtime Offer ID"
              value={runtimeId}
              onChange={e => setRuntimeId(e.target.value)}
            />

            <div className="flex gap-3">
              <button
                onClick={deploy}
                disabled={deploying || !runtimeId}
                className="bg-green-600 hover:bg-green-500 text-white px-5 py-2 rounded-md text-sm disabled:opacity-60"
              >
                {deploying ? "Deploying…" : "Deploy"}
              </button>

              <button
                onClick={() => {
                  setShowHistory(!showHistory);
                  if (!showHistory) loadHistory();
                }}
                className="border border-border px-4 py-2 rounded-md text-sm text-foreground"
              >
                {showHistory ? "Hide History" : "View History"}
              </button>
            </div>
          </>
        )}
      </div>

      {/* HISTORY */}
      {showHistory && (
        <div className="rounded-lg border border-border bg-card p-4">
          <table className="w-full text-sm">
            <thead className="text-muted-foreground bg-background">
              <tr>
                <th className="p-2 text-left">Runtime ID</th>
                <th className="p-2 text-left">Status</th>
                <th className="p-2 text-left">Deployed</th>
              </tr>
            </thead>
            <tbody>
              {history.map(h => (
                <tr key={h._id} className="border-t border-border">
                  <td className="p-2 font-mono">{h.offer_id}</td>
                  <td className="p-2">
                    {h.status === "DEPLOYED" ? (
                      <span className="text-green-400">DEPLOYED</span>
                    ) : h.status === "DEPLOYING" ? (
                      <span className="text-yellow-400">DEPLOYING</span>
                    ) : (
                      <span className="text-muted-foreground">{h.status}</span>
                    )}
                  </td>
                  <td className="p-2 text-xs text-muted-foreground">
                    {h.deployedAt
                      ? new Date(h.deployedAt).toLocaleString()
                      : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
