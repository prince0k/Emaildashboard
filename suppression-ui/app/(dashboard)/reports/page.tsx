"use client";

import { useState } from "react";
import api from "@/lib/api";

type ReportResponse = {
  offers: {
    offer_id: string;
    [key: string]: any;
  }[];
};

export default function ReportsDashboard() {
  const [date, setDate] = useState(
    new Date().toISOString().slice(0, 10)
  );

  const [open, setOpen] = useState<ReportResponse | null>(null);
  const [click, setClick] = useState<ReportResponse | null>(null);
  const [unsub, setUnsub] = useState<ReportResponse | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadReports = async () => {
    setLoading(true);
    setError("");
    setOpen(null);
    setClick(null);
    setUnsub(null);

    try {
      const [openRes, clickRes] = await Promise.all([
        api.get("/reports/opens", { params: { date } }),
        api.get("/reports/clicks", { params: { date } }),
      ]);

      setOpen(openRes.data);
      setClick(clickRes.data);

      // optional unsub endpoint
      try {
        const unsubRes = await api.get("/reports/unsub", {
          params: { date },
        });
        setUnsub(unsubRes.data);
      } catch {
        setUnsub(null);
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.error || "Failed to load reports"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">
        Reports Dashboard
      </h1>

      {/* DATE PICKER */}
      <div className="flex gap-3 items-center">
        <input
          type="date"
          className="border border-border bg-card text-foreground rounded-lg px-3 py-2 outline-none focus:border-primary transition-colors"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <button
          onClick={loadReports}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg px-4 py-2 transition-colors cursor-pointer disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Loading…" : "Load"}
        </button>
      </div>

      {error && (
        <div className="text-rose text-sm">
          {error}
        </div>
      )}

      {loading && (
        <div className="text-text-muted">
          Loading reports…
        </div>
      )}

      {/* OPEN */}
      {open && (
        <Section title="📬 Open Report">
          <ReportTable
            rows={open.offers}
            metric="unique_opens"
          />
        </Section>
      )}

      {/* CLICK */}
      {click && (
        <Section title="🖱️ Click Report">
          <ReportTable
            rows={click.offers}
            metric="unique_clicks"
          />
        </Section>
      )}

      {/* UNSUB */}
      {unsub && (
        <Section title="🚫 Unsubscribe Report">
          <ReportTable
            rows={unsub.offers}
            metric="count"
          />
        </Section>
      )}
    </div>
  );
}

/* =========================
   REUSABLE COMPONENTS
========================= */

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">
        {title}
      </h2>
      {children}
    </div>
  );
}

function ReportTable({
  rows = [],
  metric,
}: {
  rows: any[];
  metric: string;
}) {
  if (!rows.length) {
    return (
      <div className="text-text-muted text-sm">
        No data
      </div>
    );
  }

  return (
    <table className="w-full border border-border text-sm">
      <thead className="bg-panel text-text-secondary">
        <tr>
          <th className="border-b border-border p-3 text-left font-medium">
            Offer ID
          </th>
          <th className="border-b border-border p-3 text-left font-medium">
            Value
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr
            key={r.offer_id}
            className="border-t border-border hover:bg-hover/30 transition-colors"
          >
            <td className="border-b border-border p-3 font-mono text-text-secondary">
              {r.offer_id}
            </td>
            <td className="border-b border-border p-3 font-semibold text-foreground">
              {r[metric]}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}