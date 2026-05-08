"use client";

import { useEffect, useState } from "react";
import { campaignApi } from "@/lib/campaignApi";
import Link from "next/link";
import { useParams } from "next/navigation";

type SuppressionData = {
  inputCount: number;
  finalCount: number;
  removedCount: number;
  breakdown: Record<string, number>;
};

type CampaignReview = {
  runtimeOfferId: string;
  senderId: string;
  dba?: string;
  isp: string;
  segmentName: string;
  status: string;
  deployedAt?: string;
  suppression?: SuppressionData;
  redirectLinks?: any;
  optoutLink?: string;
};

export default function ReviewCampaignPage() {
  const params = useParams();
  const campaign =
    typeof params?.campaign === "string"
      ? decodeURIComponent(params.campaign)
      : "";

  const [data, setData] = useState<CampaignReview | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!campaign) return;

    async function load() {
      try {
        const res = await campaignApi.review(campaign);
        setData(res);
      } catch (err: any) {
        setError(err?.message || "Failed to load campaign review");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [campaign]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex justify-center p-10">
        <div className="w-full max-w-5xl bg-card border border-border rounded-2xl p-10 shadow-xl">
          <div style={{ textAlign: "center", color: "#9ca3af" }}>Loading campaign review...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex justify-center p-10">
        <div className="w-full max-w-5xl bg-card border border-border rounded-2xl p-10 shadow-xl">
          <div className="bg-destructive/10 border border-destructive text-destructive p-3 rounded-lg text-center">{error}</div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  // Normalize redirectLinks for display
  const redirectLinks = (() => {
  const links = data.redirectLinks;

  if (!links) return null;

  if (Array.isArray(links)) {
    return links.length ? links : null;
  }

  if (typeof links === "object") {
    return Object.keys(links).length ? links : null;
  }

  return null;
})();

  return (
    <div className="min-h-screen bg-background flex justify-center p-10">
      <div className="w-full max-w-5xl bg-card border border-border rounded-2xl p-10 shadow-xl">
        <div style={headerStyle}>
          <h2 style={titleStyle}>🔍 Campaign Review</h2>
          <p style={subtitleStyle}>{campaign}</p>
        </div>

        {/* MAIN INFO */}
        <section className="bg-muted/40 border border-border rounded-xl p-6 mb-6">
          <h3 style={sectionTitleStyle}>📋 Campaign Details</h3>
          <div style={grid2Style}>
            <InfoItem label="Runtime Offer ID" value={data.runtimeOfferId} />
            <InfoItem label="Sender" value={data.senderId} />
            <InfoItem label="DBA" value={data.dba} />
            <InfoItem label="ISP" value={data.isp} />
            <InfoItem label="Segment" value={data.segmentName} />
            <InfoItem
  label="Status"
  value={
    <span
      style={{
        padding: "4px 10px",
        borderRadius: 20,
        fontSize: 13,
        fontWeight: 600,
        background:
          data.status === "LIVE"
            ? "#14532d"
            : data.status === "FAILED"
            ? "#7f1d1d"
            : "#1e293b",
        color:
          data.status === "LIVE"
            ? "#22c55e"
            : data.status === "FAILED"
            ? "#ef4444"
            : "#94a3b8",
      }}
    >
      {data.status}
    </span>
  }
/>
            <InfoItem
              label="Deployed At"
              value={
                data.deployedAt
                  ? new Date(data.deployedAt).toLocaleString()
                  : "Not deployed"
              }
            />
          </div>
        </section>

        {/* SUPPRESSION SUMMARY */}
        <section className="bg-muted/40 border border-border rounded-xl p-6 mb-6">
          <h3 style={sectionTitleStyle}>🚫 Suppression Summary</h3>

          {data.suppression ? (
            <>
              <div style={grid3Style}>
                <InfoItem label="Input Count" value={data.suppression.inputCount} />
                <InfoItem label="Final Count" value={data.suppression.finalCount} />
                <InfoItem label="Removed Count" value={data.suppression.removedCount} />
              </div>

              <div style={{ marginTop: 24 }}>
                <h4 style={subsectionTitleStyle}>Breakdown by reason</h4>
                <div style={breakdownGridStyle}>
                  {Object.entries(data.suppression.breakdown).map(([reason, count]) => (
                    <div key={reason} style={breakdownItemStyle}>
                      <span style={breakdownReasonStyle}>{reason}</span>
                      <span style={breakdownCountStyle}>{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <p style={emptyTextStyle}>No suppression data available.</p>
          )}
        </section>

        {/* REDIRECT LINKS */}
        <section className="bg-muted/40 border border-border rounded-xl p-6 mb-6">
          <h3 style={sectionTitleStyle}>🔗 Redirect Links</h3>

          {redirectLinks ? (
            Array.isArray(redirectLinks) ? (
              <div style={linksContainerStyle}>
                {redirectLinks.map((link, idx) => (
                  <div key={idx} style={linkItemStyle}>
                    <a
  href={link}
  target="_blank"
  rel="noopener noreferrer"
  style={{ ...linkUrlStyle, textDecoration: "underline" }}
>
  {link}
</a>
                  </div>
                ))}
              </div>
            ) : (
              <div style={linksContainerStyle}>
                {Object.entries(redirectLinks).map(([key, value]) => (
                  <div key={key} style={linkItemStyle}>
                    <span style={linkKeyStyle}>{key}:</span>
                    <a
  href={String(value)}
  target="_blank"
  rel="noopener noreferrer"
  style={{ ...linkUrlStyle, textDecoration: "underline" }}
>
  {String(value)}
</a>
                  </div>
                ))}
              </div>
            )
          ) : (
            <p style={emptyTextStyle}>No redirect links configured.</p>
          )}
        </section>

        {/* OPTOUT LINK */}
        <section className="bg-muted/40 border border-border rounded-xl p-6 mb-6">
          <h3 style={sectionTitleStyle}>📧 Opt‑out Link</h3>
          <div style={optoutContainerStyle}>
            {data.optoutLink ? (
              <code style={codeStyle}>{data.optoutLink}</code>
            ) : (
              <span style={emptyTextStyle}>Not configured</span>
            )}
          </div>
        </section>

        <Link href={`/campaigns/${campaign}/send`} style={{ textDecoration: "none" }}>
          <button className="w-full py-4 rounded-xl bg-green-600 hover:bg-green-500 text-white font-semibold transition">Proceed to Send →</button>
        </Link>
      </div>
    </div>
  );
}

/* ================= SMALL COMPONENT ================= */

const InfoItem = ({ label, value }: { label: string; value: any }) => (
  <div className="bg-background border border-border rounded-lg p-4">
    <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{label}</div>
    <div className="text-lg font-semibold text-foreground">
      {value !== undefined && value !== null && value !== "" ? value : "—"}
    </div>
  </div>
);

/* ================= ENHANCED STYLES ================= */

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "linear-gradient(135deg,#0f172a,#1e293b)",
  display: "flex",
  justifyContent: "center",
  padding: "40px 20px",
};

const cardStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: 1000,
  background: "#111827",
  padding: 40,
  borderRadius: 20,
  boxShadow: "0 25px 50px -12px rgba(0,0,0,0.8)",
  color: "#fff",
};

const headerStyle: React.CSSProperties = {
  marginBottom: 30,
  borderBottom: "1px solid #1f2937",
  paddingBottom: 20,
};

const titleStyle: React.CSSProperties = {
  fontSize: 32,
  fontWeight: 700,
  margin: 0,
  background: "linear-gradient(to right, #fff, #94a3b8)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
};

const subtitleStyle: React.CSSProperties = {
  color: "#9ca3af",
  marginTop: 8,
  fontSize: 16,
  wordBreak: "break-all",
};

const sectionStyle: React.CSSProperties = {
  background: "#1f2937",
  padding: 24,
  borderRadius: 16,
  marginBottom: 24,
  border: "1px solid #374151",
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 600,
  margin: "0 0 20px 0",
  color: "#e5e7eb",
  letterSpacing: "-0.01em",
};

const subsectionTitleStyle: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 500,
  margin: "0 0 16px 0",
  color: "#d1d5db",
};

const grid2Style: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 16,
};

const grid3Style: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
  gap: 16,
};

const infoCardStyle: React.CSSProperties = {
  background: "#0f172a",
  padding: "14px 16px",
  borderRadius: 12,
  border: "1px solid #1f2937",
};

const infoLabelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 500,
  color: "#9ca3af",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  marginBottom: 4,
};

const infoValueStyle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 600,
  color: "#f9fafb",
  lineHeight: 1.3,
};

const breakdownGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
  gap: 12,
};

const breakdownItemStyle: React.CSSProperties = {
  background: "#0f172a",
  padding: "10px 14px",
  borderRadius: 30,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  border: "1px solid #1f2937",
};

const breakdownReasonStyle: React.CSSProperties = {
  fontSize: 14,
  color: "#e2e8f0",
  wordBreak: "break-word",
  paddingRight: 8,
};

const breakdownCountStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: "#22c55e",
  background: "#1a2e22",
  padding: "2px 10px",
  borderRadius: 20,
};

const linksContainerStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 10,
};

const linkItemStyle: React.CSSProperties = {
  background: "#0f172a",
  padding: "12px 16px",
  borderRadius: 10,
  border: "1px solid #1f2937",
  display: "flex",
  flexWrap: "wrap",
  alignItems: "baseline",
  gap: 8,
};

const linkKeyStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 500,
  color: "#94a3b8",
  minWidth: 80,
};

const linkUrlStyle: React.CSSProperties = {
  fontSize: 14,
  color: "#e2e8f0",
  wordBreak: "break-all",
  fontFamily: "monospace",
};

const optoutContainerStyle: React.CSSProperties = {
  background: "#0f172a",
  padding: "16px",
  borderRadius: 12,
  border: "1px solid #1f2937",
  overflowX: "auto",
};

const codeStyle: React.CSSProperties = {
  fontSize: 14,
  color: "#e2e8f0",
  fontFamily: "monospace",
  wordBreak: "break-all",
};

const emptyTextStyle: React.CSSProperties = {
  color: "#6b7280",
  fontStyle: "italic",
  margin: 0,
};

const primaryButtonStyle: React.CSSProperties = {
  width: "100%",
  padding: "18px",
  background: "linear-gradient(90deg,#22c55e,#16a34a)",
  border: "none",
  borderRadius: 14,
  fontSize: 18,
  fontWeight: 700,
  color: "#fff",
  cursor: "pointer",
  transition: "transform 0.1s, opacity 0.2s",
  boxShadow: "0 8px 20px -8px #22c55e80",
  marginTop: 8,
};

const errorStyle: React.CSSProperties = {
  background: "#7f1d1d",
  padding: 14,
  borderRadius: 12,
  border: "1px solid #b91c1c",
  color: "#fee2e2",
  textAlign: "center",
};