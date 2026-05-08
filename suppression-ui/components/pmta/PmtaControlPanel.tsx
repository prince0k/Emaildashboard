"use client";

import { useState } from "react";
import api from "@/lib/api";

export default function PmtaControlPanel({ server }: { server: any }) {
  const [action, setAction] = useState("");
  const [domain, setDomain] = useState("");
  const [ip, setIp] = useState("");
  const [mode, setMode] = useState("");
  const [jobId, setJobId] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleRun = async () => {
    if (!action) return;

    let confirmValue;

    if (action === "restart") {
      const confirm = prompt("Type YES_RESTART");
      if (confirm !== "YES_RESTART") return;
      confirmValue = "YES_RESTART";
    }

    if (action === "deleteQueue") {
      const confirm = prompt("Type YES_DELETE");
      if (confirm !== "YES_DELETE") return;
      confirmValue = "YES_DELETE";
    }

    if (action === "resetCounters") {
      const confirm = prompt("Type YES_RESET");
      if (confirm !== "YES_RESET") return;
      confirmValue = "YES_RESET";
    }

    try {
      setLoading(true);

      const res = await api.post("/pmta/execute", {
        action,
        domain,
        ip,
        mode,
        jobId,
        serverIds: [server._id], // ✅ single server fix
        confirm: confirmValue
      });

      setResult(res.data);

    } catch (err: any) {
      alert(err.response?.data?.error || "Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card-glass p-6 space-y-5">

      {/* ⚠️ WARNING */}
      <div className="text-destructive text-xs font-medium">
        ⚠️ Dangerous actions require confirmation
      </div>

      {/* ✅ SERVER INFO */}
      <div className="p-3 border border-border rounded-lg bg-muted/30">
        <p className="text-sm font-medium">{server?.name}</p>
        <p className="text-xs text-muted-foreground">{server?.code}</p>
      </div>

      {/* ✅ RESULT */}
      {result && (
        <div className="bg-black/80 text-green-400 p-4 text-xs rounded-lg overflow-auto border border-border">
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}

      {/* ✅ ACTION */}
      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="w-full p-3 rounded-lg bg-background border border-border text-left"
        >
          {action || "Select Action"}
        </button>

        {open && (
          <div className="absolute z-50 mt-2 w-full max-h-60 overflow-y-auto rounded-lg border border-border bg-card shadow-soft">
            {[
              "queues","domains","pause","resume","schedule","queueMode",
              "reload","restart","resetCounters","resetStatus",
              "disableSource","enableSource","pauseJob","resumeJob","deleteQueue"
            ].map((item) => (
              <div
                key={item}
                onClick={() => {
                  setAction(item);
                  setOpen(false);
                }}
                className="px-3 py-2 text-sm cursor-pointer hover:bg-primary hover:text-white transition"
              >
                {item}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ✅ DOMAIN */}
      {["pause","resume","schedule","deleteQueue","queueMode","disableSource","enableSource","resolve"].includes(action) && (
        <input
          placeholder="domain.com"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          className="w-full p-3 rounded-lg bg-background border border-border"
        />
      )}

      {/* ✅ MODE */}
      {action === "queueMode" && (
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value)}
          className="w-full p-3 rounded-lg bg-background border border-border"
        >
          <option value="">Select Mode</option>
          <option value="normal">Normal</option>
          <option value="backoff">Backoff</option>
        </select>
      )}

      {/* ✅ IP */}
      {["disableSource","enableSource","spf"].includes(action) && (
        <input
          placeholder="IP address"
          value={ip}
          onChange={(e) => setIp(e.target.value)}
          className="w-full p-3 rounded-lg bg-background border border-border"
        />
      )}

      {/* ✅ JOB ID */}
      {["pauseJob","resumeJob"].includes(action) && (
        <input
          placeholder="Job ID"
          value={jobId}
          onChange={(e) => setJobId(e.target.value)}
          className="w-full p-3 rounded-lg bg-background border border-border"
        />
      )}  

      {/* ✅ BUTTON */}
      <button
        onClick={handleRun}
        disabled={loading || !action}
        className="btn-primary w-full"
      >
        {loading ? "Running..." : "Run Command"}
      </button>

    </div>
  );
}