"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState,useRef  } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, CheckCircle, XCircle } from "lucide-react";
import api from "@/lib/api";

export default function Md5DownloadPortal() {
  const router = useRouter();

  const [offers, setOffers] = useState([]);
  const [rows, setRows] = useState([""]); // multiple offerIds
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");
  const [jobId, setJobId] = useState(null);
  const intervalRef = useRef(null);
  /* ---------- LOAD OFFERS ---------- */
  useEffect(() => {
    api
      .get("/offers")
      .then(res => {
        setOffers(
          Array.isArray(res.data)
            ? res.data.filter(o => o.isActive && !o.isDeleted)
            : []
        );
      })
      .catch(() => setError("Failed to load offers"));
  }, []);

  /* ---------- ROW HANDLERS ---------- */
  const addRow = () => setRows([...rows, ""]);
  const removeRow = i =>
    setRows(rows.filter((_, idx) => idx !== i));

  const updateRow = (i, val) => {
    const copy = [...rows];
    copy[i] = val;
    setRows(copy);
  };

  /* ---------- SUBMIT ---------- */
  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setResults([]);

    const offerIds = rows.filter(Boolean);

    if (!offerIds.length) {
      return setError("Select at least one offer");
    }

    setLoading(true);

    try {
      const res = await api.post("/md5-download", {
        offerIds,
      });

      const { jobId } = res.data;
setJobId(jobId);

if (intervalRef.current) {
  clearInterval(intervalRef.current);
}

intervalRef.current = setInterval(async () => {
  try {
    const status = await api.get(`/md5-status/${jobId}`);

    setResults([status.data]);

    if (status.data.status === "done") {
      clearInterval(intervalRef.current);
    }
  } catch (err) {
    console.error("Polling error");
    clearInterval(intervalRef.current);
  }
}, 2000);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
        "MD5 processing started..."
      );
    } finally {
      setLoading(false);
    }
  }
const progress = results[0];
  return (
    <div className="space-y-10 max-w-4xl">
      {/* HEADER */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            MD5 Suppression Download
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Run Optizmo MD5 sync for one or multiple offers
          </p>
        </div>

        <button
          onClick={() => router.push("/suppression")}
          className="text-xs text-blue-400 hover:text-blue-300"
        >
          ← Back
        </button>
      </div>

      {/* FORM */}
      <div className="rounded-lg border border-border bg-card p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {rows.map((offerId, i) => (
            <div key={i} className="flex gap-3">
              <select
                value={offerId}
                onChange={e => updateRow(i, e.target.value)}
                disabled={loading}
                className="flex-1 bg-background border border-border rounded-md p-2 text-sm"
              >
                <option value="">Select Active Offer</option>
                {offers.map(o => (
                  <option key={o._id} value={o._id}>
                    {o.cid} | {o.offer} |{o.sponsor}  
                  </option>
                ))}
              </select>

              {rows.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeRow(i)}
                  className="text-destructive hover:text-red-300"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>
          ))}

          <button
            type="button"
            onClick={addRow}
            className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300"
          >
            <Plus size={16} />
            Add another offer
          </button>

          <button
            disabled={loading}
            className="w-full rounded-md bg-green-600 hover:bg-green-500 transition text-white py-2 text-sm font-medium disabled:opacity-60"
          >
            {loading ? "Processing…" : "Download & Sync MD5"}
          </button>
        </form>

        {error && (
          <div className="mt-4 text-sm text-destructive">
            {error}
          </div>
        )}
      </div>

      {/* RESULTS */}
      {results.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-6 space-y-4">
          <h2 className="text-sm font-medium text-gray-300">
            Results
          </h2>

          
          {progress && (
  <div className="space-y-4 text-sm">
    <div className="flex justify-between">
      <span>Total</span>
      <span>{progress.total}</span>
    </div>

    <div className="flex justify-between">
      <span>Completed</span>
      <span className="text-green-400">
        {progress.completed}
      </span>
    </div>

    <div className="flex justify-between">
      <span>Failed</span>
      <span className="text-red-400">
        {progress.failed}
      </span>
    </div>

    <div className="flex justify-between">
      <span>Status</span>
      <span>
        {progress.status === "done"
          ? "✅ Done"
          : "⏳ Running"}
      </span>
    </div>

    {/* Progress Bar */}
    <div className="w-full bg-gray-700 rounded h-2 mt-2">
      <div
        className="bg-green-500 h-2 rounded transition-all"
        style={{
          width: `${
            progress.total > 0
              ? (progress.completed / progress.total) * 100
              : 0
          }%`,
        }}
      />
    </div>
  </div>
)}

          
        </div>
      )}
    </div>
  );
}
