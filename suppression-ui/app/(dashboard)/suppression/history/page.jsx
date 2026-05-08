"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { API_ROOT } from "@/lib/api";

export default function SuppressionHistory() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [limit, setLimit] = useState(10);

  /* ---------- LOAD JOBS ---------- */
  useEffect(() => {
    setLoading(true);
    setError("");

    api
      .get("/suppression/jobs", { params: { limit } })
      .then(res => {
        if (!Array.isArray(res.data.jobs)) throw new Error("Invalid response");
        setJobs(res.data.jobs);
      })
      .catch(() => setError("Failed to load suppression history"))
      .finally(() => setLoading(false));
  }, [limit]);

  return (
    <div className="space-y-8 max-w-6xl">
      {/* HEADER */}
      <div>
        <h1 className="text-xl font-semibold">Suppression Job History</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Recent suppression runs and final output stats.
        </p>
      </div>

      {/* CONTROLS */}
      <div className="flex items-center gap-3 text-sm">
        <span className="text-muted-foreground">Show</span>

        <select
          value={limit}
          onChange={e => setLimit(Number(e.target.value))}
          className="bg-background border border-border rounded px-2 py-1"
        >
          <option value={10}>10</option>
          <option value={25}>25</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>

        <span className="text-muted-foreground">records</span>
      </div>

      {/* STATES */}
      {loading && <div className="text-sm text-muted-foreground">Loading jobs…</div>}
      {error && <div className="text-sm text-red-400">{error}</div>}
      {!loading && jobs.length === 0 && (
        <div className="text-sm text-muted-foreground">No jobs found</div>
      )}

      {/* TABLE */}
      {jobs.length > 0 && (
        <div className="rounded-lg border border-border bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-background text-muted-foreground">
              <tr>
                <Th>Time</Th>
                <Th>Offer</Th>
                <Th>Input File</Th>
                <Th>Input</Th>
                <Th>Offer MD5</Th>
                <Th>Unsub</Th>
                <Th>Global</Th>
                <Th>Bounce</Th>
                <Th>Complaint</Th>
                <Th>Final</Th>
                <Th>Status</Th>
                <Th>WGET</Th>
              </tr>
            </thead>

            <tbody>
              {jobs.map(j => (
                <tr
                  key={j._id}
                  className="border-t border-border hover:bg-background"
                >
                  <Td>{new Date(j.createdAt).toLocaleString()}</Td>

                  <Td>
                    <div className="text-xs text-muted-foreground">
                      {j.sponsor || "-"} | {j.cid || "-"}<br />
                      <span className="text-muted-foreground">{j.offer || "-"}</span>
                    </div>
                  </Td>

                  <Td className="font-mono text-xs">{j.inputFile}</Td>

                  <Td>{j.counts?.input ?? "-"}</Td>
                  <Td>{j.counts?.offer_md5 ?? "-"}</Td>
                  <Td>{j.counts?.unsubscribe ?? "-"}</Td>
                  <Td>{j.counts?.global ?? "-"}</Td>
                  <Td>{j.counts?.bounce ?? "-"}</Td>
                  <Td>{j.counts?.complaint ?? "-"}</Td>

                  <Td className="font-semibold text-gray-100">
                    {j.finalCount ?? j.counts?.kept ?? "-"}
                  </Td>

                  <Td>
                    <StatusBadge status={j.status} />
                  </Td>

                  <Td className="font-mono text-xs text-gray-300">
                    {j.outputFile ? (
                      <>wget {API_ROOT}/output/{j.outputFile}</>
                    ) : (
                      "-"
                    )}
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ---------- SMALL COMPONENTS ---------- */

function Th({ children }) {
  return (
    <th className="p-3 text-left whitespace-nowrap font-medium text-muted-foreground">
      {children}
    </th>
  );
}

function Td({ children, className = "" }) {
  return <td className={`p-3 align-top ${className}`}>{children}</td>;
}

function StatusBadge({ status }) {
  const color =
    status === "DONE"
      ? "bg-green-600"
      : status === "FAILED"
      ? "bg-red-600"
      : "bg-yellow-500";

  return (
    <span className={`px-2 py-1 text-xs text-white rounded ${color}`}>
      {status || "UNKNOWN"}
    </span>
  );
}
