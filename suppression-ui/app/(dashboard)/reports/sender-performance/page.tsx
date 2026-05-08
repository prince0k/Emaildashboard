"use client";

import { useMemo, useState } from "react";
import api from "@/lib/api";

type GroupBy = "ip" | "domain";

type SenderPerformanceRow = {
  key: string;
  sent: number;
  delivered: number;
  open: number;
  click: number;
  unsub: number;
  optout: number;
  complaint: number;
  bounce: number;
};

export default function SenderPerformancePage() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [groupBy, setGroupBy] = useState<GroupBy>("ip");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rows, setRows] = useState<SenderPerformanceRow[]>([]);

  const totals = useMemo(
    () =>
      rows.reduce(
        (acc, row) => {
          acc.sent += row.sent;
          acc.delivered += row.delivered;
          acc.open += row.open;
          acc.click += row.click;
          acc.unsub += row.unsub;
          acc.optout += row.optout;
          acc.complaint += row.complaint;
          acc.bounce += row.bounce;
          return acc;
        },
        {
          sent: 0,
          delivered: 0,
          open: 0,
          click: 0,
          unsub: 0,
          optout: 0,
          complaint: 0,
          bounce: 0,
        }
      ),
    [rows]
  );

  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await api.get("/reports/senderPerformance", {
        params: { date, groupBy },
      });

      setRows(res?.data?.data || []);
    } catch (err: any) {
      setRows([]);
      setError(err?.response?.data?.error || "Failed to load sender performance data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Sender Performance Report</h1>
        <p className="text-sm text-muted-foreground mt-1">
          IP wise ya domain wise sent, delivered, open, click, unsub, optout, complaint aur bounce metrics.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="border border-border bg-background rounded-lg px-3 py-2 text-sm"
        />

        <div className="inline-flex rounded-lg border border-border overflow-hidden">
          <button
            onClick={() => setGroupBy("ip")}
            className={`px-3 py-2 text-sm ${
              groupBy === "ip" ? "bg-foreground text-background" : "bg-background"
            }`}
          >
            IP Wise
          </button>
          <button
            onClick={() => setGroupBy("domain")}
            className={`px-3 py-2 text-sm border-l border-border ${
              groupBy === "domain" ? "bg-foreground text-background" : "bg-background"
            }`}
          >
            Domain Wise
          </button>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="px-4 py-2 rounded-lg bg-black text-white text-sm disabled:opacity-60"
        >
          {loading ? "Loading..." : "Load Report"}
        </button>
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}

      <div className="overflow-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="text-left p-3 border-b border-border">{groupBy === "ip" ? "IP" : "Domain"}</th>
              <th className="text-left p-3 border-b border-border">Sent</th>
              <th className="text-left p-3 border-b border-border">Delivered</th>
              <th className="text-left p-3 border-b border-border">Open</th>
              <th className="text-left p-3 border-b border-border">Click</th>
              <th className="text-left p-3 border-b border-border">Unsub</th>
              <th className="text-left p-3 border-b border-border">Optout</th>
              <th className="text-left p-3 border-b border-border">Complaint</th>
              <th className="text-left p-3 border-b border-border">Bounce</th>
            </tr>
          </thead>
          <tbody>
            {!rows.length && !loading ? (
              <tr>
                <td colSpan={9} className="p-4 text-muted-foreground">
                  No data found for selected date.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.key} className="border-b border-border/70">
                  <td className="p-3 font-medium">{row.key}</td>
                  <td className="p-3">{row.sent}</td>
                  <td className="p-3">{row.delivered}</td>
                  <td className="p-3">{row.open}</td>
                  <td className="p-3">{row.click}</td>
                  <td className="p-3">{row.unsub}</td>
                  <td className="p-3">{row.optout}</td>
                  <td className="p-3">{row.complaint}</td>
                  <td className="p-3">{row.bounce}</td>
                </tr>
              ))
            )}
          </tbody>

          {!!rows.length && (
            <tfoot className="bg-muted/30 font-semibold">
              <tr>
                <td className="p-3">Total</td>
                <td className="p-3">{totals.sent}</td>
                <td className="p-3">{totals.delivered}</td>
                <td className="p-3">{totals.open}</td>
                <td className="p-3">{totals.click}</td>
                <td className="p-3">{totals.unsub}</td>
                <td className="p-3">{totals.optout}</td>
                <td className="p-3">{totals.complaint}</td>
                <td className="p-3">{totals.bounce}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}