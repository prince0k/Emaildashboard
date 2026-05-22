"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import api from "@/lib/api";
import { API_ROOT } from "@/lib/api";
import { Shield, History, Download, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SuppressionPortal() {
  const router = useRouter();

  const [offers, setOffers] = useState([]);
  const [offerId, setOfferId] = useState("");
  const [inputFile, setInputFile] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const selectedOffer = offers.find(o => o._id === offerId);

  useEffect(() => {
    api
      .get("/offers")
      .then(res => {
        setOffers(Array.isArray(res.data) ? res.data.filter(o => o.isActive) : []);
      })
      .catch(() => setError("Failed to load offers"));
  }, []);

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
      const res = await api.post("/suppression/portal", { offerId, inputFile });
      setResult(res.data);
    } catch (err) {
      setError(err?.response?.data?.error || err?.response?.data?.message || "Suppression failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8 max-w-5xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* HEADER */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-gradient">Suppression Portal</h1>
          <p className="text-sm text-text-muted">
            Run sender-level and global suppression against uploaded segments.
          </p>
        </div>

        <button
          onClick={() => router.push("/suppression/history")}
          className="flex items-center gap-2 text-xs font-bold text-primary hover:text-cyan transition-colors uppercase tracking-widest"
        >
          <History size={14} />
          View History
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* FORM CARD */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface border border-border rounded-2xl p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-30" />
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest px-1">Select Active Offer</label>
                  <select
                    value={offerId}
                    onChange={e => setOfferId(e.target.value)}
                    className="w-full bg-panel border border-border rounded-xl p-3 text-sm focus:border-primary outline-none transition-all appearance-none"
                  >
                    <option value="">Choose an offer...</option>
                    {offers.map(o => (
                      <option key={o._id} value={o._id}>
                        {o.sponsor} | {o.cid} | {o.offer}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest px-1">Input Segment File</label>
                  <input
                    className="w-full bg-panel border border-border rounded-xl p-3 text-sm focus:border-primary outline-none transition-all placeholder:text-text-muted/50"
                    placeholder="example: seg_01.txt"
                    value={inputFile}
                    onChange={e => setInputFile(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              <button
                disabled={loading}
                className={cn(
                  "w-full rounded-xl py-3 text-sm font-bold transition-all flex items-center justify-center gap-2 uppercase tracking-widest",
                  loading 
                    ? "bg-panel text-text-muted cursor-not-allowed" 
                    : "bg-primary text-white hover:shadow-[0_0_20px_rgba(99,130,255,0.4)]"
                )}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-text-muted border-t-white rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Shield size={16} />
                    Execute Suppression
                  </>
                )}
              </button>
            </form>

            {error && (
              <div className="mt-4 p-4 rounded-xl bg-rose/10 border border-rose/20 text-rose text-xs flex items-center gap-2">
                <AlertCircle size={14} />
                {error}
              </div>
            )}
          </div>
        </div>

        {/* SIDEBAR TIPS */}
        <div className="space-y-6">
          <div className="bg-surface border border-border rounded-2xl p-5 shadow-xl space-y-4">
            <div className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]">Operational Notes</div>
            <ul className="space-y-3">
              {[
                "Global blocklists are applied automatically.",
                "MD5 hashing occurs during processing.",
                "Resulting files are archived for 30 days.",
                "Ensure segments are in raw TXT format."
              ].map((tip, i) => (
                <li key={i} className="flex gap-3 text-xs text-text-secondary leading-relaxed">
                  <div className="w-1 h-1 rounded-full bg-primary mt-1.5 shrink-0" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* RESULT PANEL */}
      {result && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface border border-border rounded-2xl p-6 space-y-8 shadow-2xl relative"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald/10 flex items-center justify-center text-emerald">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <h3 className="font-bold">Suppression Complete</h3>
                <p className="text-[10px] font-mono text-text-muted uppercase">JOB ID: {result.jobId}</p>
              </div>
            </div>
            <button className="bg-panel border border-border px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-hover transition-colors">
              Refresh Status
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* STATS TABLE */}
            <div className="overflow-hidden rounded-xl border border-border">
              <table className="w-full text-xs text-left">
                <thead className="bg-panel text-text-muted font-mono uppercase text-[10px]">
                  <tr>
                    <th className="px-4 py-2 font-normal">Suppression Step</th>
                    <th className="px-4 py-2 font-normal text-right">Count Removed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50 font-mono">
                  <StatRow label="Invalid Emails" value={result.stats?.invalid} />
                  <StatRow label="Offer MD5 Match" value={result.stats?.offer_md5} />
                  <StatRow label="Sender Unsubscribes" value={result.stats?.unsubscribe} />
                  <StatRow label="Global Blocklist" value={result.stats?.global} />
                  <StatRow label="Hard Bounces" value={result.stats?.bounce} />
                  <StatRow label="Spam Complaints" value={result.stats?.complaint} />
                  <StatRow label="Duplicate Records" value={result.stats?.duplicates} />
                  <tr className="bg-emerald/[0.03] text-emerald font-bold">
                    <td className="px-4 py-3 border-t-2 border-emerald/20">Final Deliverable Segment</td>
                    <td className="px-4 py-3 border-t-2 border-emerald/20 text-right">{result.stats?.kept || "0"}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* DOWNLOAD SECTION */}
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Download Command</label>
                  <span className="text-[10px] text-primary">Terminal Access Only</span>
                </div>
                {selectedOffer && (
                  <div className="relative group">
                    <pre className="bg-panel/50 border border-border rounded-xl p-4 text-[10px] font-mono text-text-secondary leading-relaxed break-all whitespace-pre-wrap">
                      wget -O {safeFileName(selectedOffer.sponsor)}_{safeFileName(selectedOffer.cid)}_{safeFileName(selectedOffer.vid)} {API_ROOT}{result.downloadUrl}
                    </pre>
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Download size={14} className="text-primary cursor-pointer hover:text-cyan" />
                    </div>
                  </div>
                )}
                <p className="text-[10px] text-text-muted leading-relaxed">
                  Execute this command on your mailing server to fetch the suppressed segment directly.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function StatRow({ label, value }) {
  return (
    <tr className="hover:bg-hover/50 transition-colors">
      <td className="px-4 py-2.5 text-text-secondary">{label}</td>
      <td className={cn("px-4 py-2.5 text-right", value > 0 ? "text-rose" : "text-text-muted")}>
        {value ?? "-"}
      </td>
    </tr>
  );
}

function safeFileName(str = "") {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}
