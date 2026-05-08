"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { API_ROOT } from "@/lib/api";

export default function SuppressionPortal() {
  const router = useRouter();

  const [offers, setOffers] = useState([]);
  const [offerId, setOfferId] = useState("");
  const [inputFile, setInputFile] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
const selectedOffer = offers.find(o => o._id === offerId);

  /* ---------- LOAD OFFERS ---------- */
  useEffect(() => {
    api
      .get("/offers") // ✅ same api instance
      .then(res => {
        setOffers(
          Array.isArray(res.data)
            ? res.data.filter(o => o.isActive)
            : []
        );
      })
      .catch(() => setError("Failed to load offers"));
  }, []);


  /* ---------- SUBMIT ---------- */
  async function handleSubmit(e) {
  e.preventDefault();
  setError("");
  setResult(null);

  if (!offerId) return setError("Please select an offer");
  if (!inputFile.trim()) return setError("Please enter input file name");
  if (!/\.txt$/i.test(inputFile)) {
    return setError("Segment file must be a .txt file");
  }

  setLoading(true);

  try {
    const res = await api.post("/suppression/portal", {
      offerId,
      inputFile,
    });

    setResult(res.data);
    console.log("SUPPRESSION RESULT FROM API:", res.data);
  } catch (err) {
    setError(
      err?.response?.data?.error ||
        err?.response?.data?.message ||
        "Suppression failed"
    );
  } finally {
    setLoading(false);
  }
}

  return (
    <div className="space-y-10 max-w-4xl">
      {/* HEADER */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Suppression Portal
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Run sender-level and global suppression against uploaded segments.
          </p>
        </div>

        <button
          onClick={() => router.push("/suppression/history")}
          className="text-xs text-blue-400 hover:text-blue-300"
        >
          View History →
        </button>
      </div>

      {/* FORM CARD */}
      <div className="rounded-lg border border-border bg-card p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select
  value={offerId}
  onChange={e => setOfferId(e.target.value)}
>
  <option value="">Select Active Offer</option>
  {offers.map(o => (
    <option key={o._id} value={o._id}>
      {o.sponsor} | {o.cid} | {o.offer}
    </option>
  ))}
</select>


            <input
              className="md:col-span-2 bg-background border border-border rounded-md p-2 text-sm"
              placeholder="Segment file (example: seg_01.txt)"
              value={inputFile}
              onChange={e => setInputFile(e.target.value)}
              disabled={loading}
            />
          </div>

          <button
            disabled={loading}
            className="w-full rounded-md bg-blue-600 hover:bg-blue-500 transition text-white py-2 text-sm font-medium disabled:opacity-60"
          >
            {loading ? "Processing…" : "Run Suppression"}
          </button>
        </form>

        {error && (
          <div className="mt-4 text-sm text-destructive">
            {error}
          </div>
        )}
      </div>

      {/* RESULT */}
      {result && (
        <div className="rounded-lg border border-border bg-card p-6 space-y-6">
          <div className="text-sm">
            <span className="text-muted-foreground">Job ID:</span>{" "}
            <span className="font-mono">{result.jobId}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-border">
              <thead className="bg-background text-muted-foreground">
                <tr>
                  <th className="p-2 text-left border-b border-border">
                    Step
                  </th>
                  <th className="p-2 text-right border-b border-border">
                    Count
                  </th>
                </tr>
              </thead>
              <tbody>
                <Row label="Invalid Emails" value={result.stats?.invalid} />
<Row label="Offer MD5 Removed" value={result.stats?.offer_md5} />
<Row label="Sender Unsub Removed" value={result.stats?.unsubscribe} />
<Row label="Global Block Removed" value={result.stats?.global} />
<Row label="Bounce Removed" value={result.stats?.bounce} />
<Row label="Complaint Removed" value={result.stats?.complaint} />
<Row label="Duplicates Removed" value={result.stats?.duplicates} />
<Row label="✅ Final Output" value={result.stats?.kept} strong />


              </tbody>
            </table>
          </div>

          {/* DOWNLOAD */}
          <div>
            <div className="text-xs text-muted-foreground mb-2">
              Download command
            </div>
            {selectedOffer && (
            <div className="rounded-md bg-background border border-border p-3 text-xs font-mono text-gray-200">
              wget -O {safeFileName(selectedOffer.sponsor)}_{safeFileName(selectedOffer.cid)}_{safeFileName(selectedOffer.vid)} {API_ROOT}{result.downloadUrl}
            </div>
          )}
            <div className="text-xs text-gray-500 mt-2">
              Run this on your server / terminal to fetch the final file.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- ROW ---------- */

function Row({ label, value, strong }) {
  return (
    <tr className={`${strong ? "bg-background" : ""} hover:bg-muted/40`}>
      <td className="p-2 border-t border-border">
        {label}
      </td>
      <td className="p-2 border-t border-border text-right font-mono">
        {value ?? "-"}
      </td>
    </tr>
  );
}

function safeFileName(str = "") {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

