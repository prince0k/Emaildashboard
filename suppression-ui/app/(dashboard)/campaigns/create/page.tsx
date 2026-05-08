"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { campaignApi } from "@/lib/campaignApi";
import { useRouter } from "next/navigation";

export default function CreateCampaignPage() {
  const router = useRouter();
  const [servers, setServers] = useState<any[]>([]);
  const [offers, setOffers] = useState<any[]>([]);
  const [creatives, setCreatives] = useState<any[]>([]);
  type Segment = {
  name: string;
  file: string;
  count?: number;
};

const [segments, setSegments] = useState<Segment[]>([]);
  const [selectedServer, setSelectedServer] = useState<any>(null);
  const [selectedOffer, setSelectedOffer] = useState<any>(null);
  const [isManualName, setIsManualName] = useState(false);
  const today = new Date().toISOString().split("T")[0];
  const [form, setForm] = useState({
  campaignName: "",
  creativeId: "",
  senderId: "",
  offerId: "",   // 🔥 add this
  isp: "comcast",
  segmentName: "",
  scheduledDate: today,
});
  const [runtimePreview, setRuntimePreview] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  /* ================= LOAD INITIAL DATA ================= */

  useEffect(() => {
  async function loadAll() {
    try {
      const [serversRes, offersRes, segmentsRes] = await Promise.all([
        api.get("/senders", { params: { active: true } }),
        api.get("/offers"),
        api.get("/segments/list"),
      ]);

      const serversData = serversRes.data;
      const offersData = offersRes.data;
      const segmentsData = segmentsRes.data;

      setServers(
        Array.isArray(serversData?.senders)
          ? serversData.senders
          : []
      );

      setOffers(Array.isArray(offersData) ? offersData : []);

      const segmentList =
        Array.isArray(segmentsData)
          ? segmentsData
          : Array.isArray(segmentsData?.segments)
          ? segmentsData.segments
          : Array.isArray(segmentsData?.files)
          ? segmentsData.files
          : [];

      setSegments(segmentList);
    } catch (err) {
      console.error(err);
      setError("Failed to load configuration.");
    }
  }

  loadAll();
}, []);


useEffect(() => {
  const data = localStorage.getItem("copyCampaignData");

  if (!data) return;

  try {
    const parsed = JSON.parse(data);

    // 🔥 SET SERVER
    setForm((prev) => ({
      ...prev,
      senderId: parsed.sender,
      isp: parsed.isp || "",
      segmentName: parsed.segmentName || "",
    }));

    // 🔥 set selected server
    const server = servers.find(
      (s) => String(s._id) === String(parsed.sender)
    );
    setSelectedServer(server || null);

    // 🔥 SET OFFER
    const offer = offers.find(
      (o) => String(o._id) === String(parsed.offerId)
    );
    setSelectedOffer(offer || null);

    // 🔥 SET CREATIVE (after offer load)
    setForm((prev) => ({
      ...prev,
      creativeId: parsed.creativeId || "",
    }));
    localStorage.removeItem("copyCampaignData");

  } catch (err) {
    console.error("Prefill error:", err);
  }
}, [servers, offers]);
  /* ================= LOAD CREATIVES ================= */

  useEffect(() => {
    if (!selectedOffer?._id ) {
      setCreatives([]);
      return;
    }

    async function loadCreatives() {
      try {
        const res = await api.get("/offers/creatives/list", {
          params: { offerId: selectedOffer._id },
        });

        const data = res.data;

        setCreatives(
          Array.isArray(data)
            ? data
            : Array.isArray(data?.creatives)
            ? data.creatives
            : []
        );
      } catch {
        setCreatives([]);
      }
    }

    loadCreatives();
  }, [selectedOffer]);

  /* ================= AUTO CAMPAIGN NAME ================= */

useEffect(() => {
  if (!selectedOffer || !form.isp || !form.scheduledDate) return;
  if (isManualName) return;

  const selectedDate = new Date(form.scheduledDate);

  const dateStr =
    selectedDate.getFullYear().toString() +
    String(selectedDate.getMonth() + 1).padStart(2, "0") +
    String(selectedDate.getDate()).padStart(2, "0");

  const autoName = [
    form.isp,
    selectedOffer.offer,
    selectedOffer.cid,
    dateStr,
  ]
    .filter(Boolean)
    .join("_")
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .toLowerCase();

  setForm((prev) => ({
    ...prev,
    campaignName: autoName,
  }));
}, [selectedOffer, form.isp, form.scheduledDate, isManualName]);

  /* ================= RUNTIME PREVIEW ================= */

useEffect(() => {
  if (!selectedOffer || !form.campaignName || !selectedServer) {
    setRuntimePreview("");
    return;
  }

  const preview = [
    
    selectedServer.code || selectedServer.name,
    selectedOffer.offer,
    selectedOffer.cid,
    selectedOffer.sid,
    form.campaignName,
    
  ]
    .filter(Boolean)
    .join("_")
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .toLowerCase();

  setRuntimePreview(preview);

}, [selectedOffer, selectedServer, form.campaignName]);

  /* ================= VALIDATION ================= */

  const validate = () => {
    if (!form.senderId) return "Server required";
    if (!selectedOffer) return "Offer required";
    if (!form.creativeId) return "Creative required";
    if (!form.isp) return "ISP required";
    if (!form.segmentName) return "Segment required";
    if (!form.campaignName.trim()) return "Campaign name required";
    return null;
  };

  /* ================= SUBMIT ================= */

  const submit = async () => {
  if (loading) return;

  setError("");

  const validationError = validate();
  if (validationError) {
    setError(validationError);
    return;
  }

  try {
    setLoading(true);

    const payload = {
      sender: form.senderId,
      campaignName: form.campaignName,
      creativeId: form.creativeId,
      offerId: selectedOffer._id,
      isp: form.isp,
      segmentName: form.segmentName,
      scheduledDate: form.scheduledDate,
    };
    console.log("FINAL PAYLOAD:", payload);

    const response = await campaignApi.create(payload);

    router.push(`/campaigns/${response.campaign}/review`);
  } catch (err: any) {
    console.log("ERROR:", err);
    setError(err?.response?.data?.error || err.message);
  } finally {
    setLoading(false);
  }
};

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-card/80 backdrop-blur-sm border border-border/60 rounded-2xl p-8 shadow-soft space-y-6">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </div>
  );
}
type SelectOption = {
  value: string;
  label: string;
};

type SelectProps = {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: SelectOption[];
};

function Select({
  label,
  value,
  onChange,
  options,
}: SelectProps) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </label>
      <select
        value={value}
        onChange={onChange}
        className="w-full bg-background border border-border/60 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
      >
        <option value="">Select {label}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

type InputProps = {
  label: string;
  value: string;
  type?: string;
  min?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

function Input({
  label,
  value,
  type = "text",
  min,
  onChange,
}: InputProps) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </label>
      <input
        type={type}
        min={min}
        value={value}
        onChange={onChange}
        className="w-full bg-background border border-border/60 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
      />
    </div>
  );
}
  /* ================= UI ================= */

  return (
  <div className="min-h-screen flex justify-center px-6 py-10 bg-background">
    <div className="w-full max-w-6xl space-y-8">

      {/* HEADER */}
      <div className="bg-card/80 backdrop-blur-sm border border-border/60 rounded-2xl p-8 shadow-soft">
        <h1 className="text-2xl font-semibold tracking-tight">
          Create Campaign
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          Configure sender, offer and schedule
        </p>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/30 text-destructive text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {/* BASIC CONFIG */}
      <Section title="Basic Configuration">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Select
            label="Server"
            value={form.senderId}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
              const server = servers.find(
                (s) => String(s._id) === e.target.value
              );
              setSelectedServer(server || null);
              setForm((prev) => ({
                ...prev,
                senderId: e.target.value,
              }));
            }}
            options={servers.map((s) => ({
              value: String(s._id),
              label: s.name || s.label,
            }))}
          />

          <Select
            label="Offer"
            value={selectedOffer?._id || ""}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
              const offer = offers.find(
                (o) => String(o._id) === e.target.value
              );
              setSelectedOffer(offer || null);
              setForm((prev) => ({ ...prev, creativeId: "" }));
            }}
            options={offers.map((o) => ({
              value: String(o._id),
              label: `${o.cid} | ${o.offer}`,
            }))}
          />

          {selectedOffer && (
            <Select
              label="Creative"
              value={form.creativeId}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setForm((prev) => ({
                  ...prev,
                  creativeId: e.target.value,
                }))
              }
              options={creatives.map((c) => ({
                value: String(c._id),
                label: c.name || c.creativeName,
              }))}
            />
          )}

          <Select
            label="ISP"
            value={form.isp}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setForm((prev) => ({
                ...prev,
                isp: e.target.value,
              }))
            }
            options={[
              { value: "gmail", label: "Gmail" },
              { value: "yahoo", label: "Yahoo" },
              { value: "comcast", label: "Comcast" },
              { value: "aol", label: "AOL" },
              { value: "mixed", label: "Mixed" },
            ]}
          />
        </div>

        {runtimePreview && (
          <div className="mt-6 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-sm">
            <div className="font-semibold text-emerald-600 dark:text-emerald-400">
              Runtime Offer ID
            </div>
            <div className="mt-1 break-all text-muted-foreground">
              {runtimePreview}
            </div>
          </div>
        )}
      </Section>

      {/* FINAL SETTINGS */}
      <Section title="Final Settings">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Scheduled Date"
            type="date"
            min={today}
            value={form.scheduledDate}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setForm((prev) => ({
                ...prev,
                scheduledDate: e.target.value,
              }))
            }
          />

          <Input
            label="Campaign Name"
            value={form.campaignName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setIsManualName(true);
              setForm((prev) => ({
                ...prev,
                campaignName: e.target.value,
              }));
            }}
          />

          <Select
            label="Segment"
            value={form.segmentName}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setForm((prev) => ({
                ...prev,
                segmentName: e.target.value,
              }))
            }
            options={segments.map((s) => ({
              value: s.file,
              label: `${s.name} (${s.count ?? 0})`,
            }))}
          />
        </div>
      </Section>

      {/* SUBMIT */}
      <button
        onClick={submit}
        disabled={loading}
        className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 disabled:opacity-60 transition"
      >
        {loading ? "Creating..." : "Create Campaign"}
      </button>
    </div>
  </div>
);
}

