"use client";

import { useState, useEffect } from "react";
import { campaignApi } from "@/lib/campaignApi";
import { useParams } from "next/navigation";
import CampaignInfo from "@/components/send/CampaignInfo";
import CreativeEditor from "@/components/send/CreativeEditor";
import ExecutionSettings from "@/components/send/ExecutionSettings";
import FormatSettings from "@/components/send/FormatSettings";
import AdvancedHeaderSettings from "@/components/send/AdvancedHeaderSettings";
import RunButton from "@/components/send/RunButton";
import ConfirmModal from "@/components/send/ConfirmModal";
import CampaignControls from "@/components/CampaignControls";
// Minimal type for campaign data (extend according to your API)
interface Campaign {
  sender: string;
  senderServerId?: string;
  status?: string;
  runtimeOfferId?: string;

  sendConfig?: {
    mode?: "TEST" | "LIVE";

    subject?: string;
    fromName?: string;

    trackingMode?: "from" | "domain";
    trackingDomain?: string;

    aliases?: string[];
    seeds?: string[];

    totalSend?: number;

    sendInSeconds?: number;
    sendInMinutes?: number;
    sendInHours?: number;

    seedAfter?: number;
    seedMode?: "round" | "random";
  };

  suppression?: {
  inputCount: number;
  finalCount: number;
  removedCount: number;

  status?: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED" | "USED"; // 🔥 ADD THIS

  jobId?: string;
  outputFile?: string;
  runAt?: string;

  breakdown?: any;
};

  subjectLines?: string[];
  fromLines?: string[];

  routes?: Array<{
    domain: string;
    from_user: string;
    vmta: string;
  }>;
  availableRoutes?: Array<{
    _id?: string;
    domain: string;
    from_user: string;
    vmta: string;
    active?: boolean;
  }>;

  trackingMode?: "from" | "domain";
  trackingDomain?: string;
}

export default function SendCampaignPage() {
  const params = useParams();
  const campaign =
    typeof params.campaign === "string"
      ? decodeURIComponent(params.campaign)
      : "";

  const [campaignData, setCampaignData] = useState<Campaign | null>(null);
  const [bulkInput, setBulkInput] = useState("");
  const [debounceTimer, setDebounceTimer] = useState<any>(null);
  /* ================= CREATIVE ================= */
  const [creativeOverride, setCreativeOverride] = useState("");

  /* ================= EXECUTION ================= */
  const [mode, setMode] = useState<"TEST" | "LIVE">("TEST");
  const [seeds, setSeeds] = useState("");
  const [testRoutes, setTestRoutes] = useState<number | "">("");
  const [testSeeds, setTestSeeds] = useState<number | "">("");
  const [testTotalSend, setTestTotalSend] = useState<number | "">("");
  const [totalSend, setTotalSend] = useState(100);
  const [sendInSeconds, setSendInSeconds] = useState<number | "">("");
  const [sendInMinutes, setSendInMinutes] = useState<number | "">("");
  const [sendInHours, setSendInHours] = useState<number | "">("");
  const [liveStats, setLiveStats] = useState<any>(null);
  const [seedAfter, setSeedAfter] = useState<number | "">("");
  const [seedMode, setSeedMode] = useState<"round" | "random">("round");
  const [started, setStarted] = useState(false);
  const [aliases, setAliases] = useState("");
  const [trackingMode, setTrackingMode] = useState<"from" | "domain">("from");
  const [trackingDomain, setTrackingDomain] = useState("");
  const [suppressing, setSuppressing] = useState(false);
const suppressed =
  campaignData?.suppression?.status === "COMPLETED";
const [suppressStats, setSuppressStats] = useState<any>(null);
  const [selectedRoutes, setSelectedRoutes] = useState<
    Array<{ domain: string; from_user: string; vmta: string }>
  >([]);
  const [routeSaving, setRouteSaving] = useState(false);
  const [routeSaveError, setRouteSaveError] = useState("");

  /* ================= FORMAT SETTINGS ================= */
  const [contentMode, setContentMode] = useState<"multipart" | "html">(
    "multipart"
  );
  const [textEncoding, setTextEncoding] = useState<
    "base64" | "quoted-printable" | "7bit"
  >("base64");
  const [htmlEncoding, setHtmlEncoding] = useState<
    "base64" | "quoted-printable" | "7bit"
  >("base64");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [floatingAlert, setFloatingAlert] = useState<string | null>(null);
  useEffect(() => {
  if (!floatingAlert) return;

  const timer = setTimeout(() => {
    setFloatingAlert(null);
  }, 4000);

  return () => clearTimeout(timer);
}, [floatingAlert]);
  
  /* ENVELOPE */
  const [envelopeMode, setEnvelopeMode] = useState<"route" | "random" | "custom">(
    "route"
  );
  const [envelopeCustomType, setEnvelopeCustomType] = useState<
    "fixed" | "pattern"
  >("pattern");
  const [envelopeCustomEmail, setEnvelopeCustomEmail] = useState("");
  const [envelopeCustomDomain, setEnvelopeCustomDomain] = useState("");
  const [envelopePatternBlocks, setEnvelopePatternBlocks] = useState(3);
  const [envelopePatternLength, setEnvelopePatternLength] = useState(5);

  /* HEADER */
  const [headerMode, setHeaderMode] = useState<"route" | "random" | "custom">(
    "route"
  );
  const [headerCustomType, setHeaderCustomType] = useState<
    "fixed" | "pattern"
  >("pattern");
  const [headerCustomEmail, setHeaderCustomEmail] = useState("");
  const [headerCustomDomain, setHeaderCustomDomain] = useState("");
  const [headerPatternBlocks, setHeaderPatternBlocks] = useState(3);
  const [headerPatternLength, setHeaderPatternLength] = useState(5);

  /* SUBJECT + FROM */
const [subject, setSubject] = useState("");
const [fromName, setFromName] = useState("");

// ===== Subject Dropdown =====
const [subjectOpen, setSubjectOpen] = useState(false);
const [subjectQuery, setSubjectQuery] = useState("");

const filteredSubjects =
  campaignData?.subjectLines?.filter((s) =>
    s.toLowerCase().includes(subjectQuery.toLowerCase())
  ) || [];

// ===== From Dropdown =====
const [fromOpen, setFromOpen] = useState(false);
const [fromQuery, setFromQuery] = useState("");

const filteredFrom =
  campaignData?.fromLines?.filter((f) =>
    f.toLowerCase().includes(fromQuery.toLowerCase())
  ) || [];


/* FULL HEADER BLOCK */
const [headerBlockMode, setHeaderBlockMode] = useState<"default" | "custom">("default");
const [customHeaderBlock, setCustomHeaderBlock] = useState("");


  /* ================= MODAL STATE ================= */
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState<{
    onConfirm: () => void;
    message: string;
  } | null>(null);

  /* ================= UI COLLAPSE STATES ================= */
  const [formatOpen, setFormatOpen] = useState(false);
  const [headerAdvancedOpen, setHeaderAdvancedOpen] = useState(false);

  /* ================= LOAD ================= */
  useEffect(() => {
  async function loadCampaign() {
    try {
      const campaignRes = await campaignApi.review(campaign);
      setCampaignData(campaignRes);
      setSelectedRoutes(
        Array.isArray(campaignRes?.routes) ? campaignRes.routes : []
      );

      // ✅ Restore saved execution settings (SAFE WAY)
      if (campaignRes?.sendConfig) {
        const c = campaignRes.sendConfig;

        if (c.mode !== undefined) setMode(c.mode);
        if (c.trackingMode !== undefined) setTrackingMode(c.trackingMode);
        if (c.trackingDomain !== undefined) setTrackingDomain(c.trackingDomain);

        if (c.subject !== undefined) setSubject(c.subject);
        if (c.fromName !== undefined) setFromName(c.fromName);

        if (Array.isArray(c.aliases)) {
          setAliases(c.aliases.join("\n"));
        }

        if (Array.isArray(c.seeds)) {
          setSeeds(c.seeds.join(","));
        }

        if (c.totalSend !== undefined) setTotalSend(c.totalSend);

        if (c.seedAfter !== undefined) setSeedAfter(c.seedAfter);
        if (c.seedMode !== undefined) setSeedMode(c.seedMode);

        if (c.sendInSeconds !== undefined) setSendInSeconds(c.sendInSeconds);
        if (c.sendInMinutes !== undefined) setSendInMinutes(c.sendInMinutes);
        if (c.sendInHours !== undefined) setSendInHours(c.sendInHours);

        if (c.testRoutes !== undefined) setTestRoutes(c.testRoutes);
        if (c.testSeeds !== undefined) setTestSeeds(c.testSeeds);
        if (c.testTotalSend !== undefined) setTestTotalSend(c.testTotalSend);
      } else {
        // ✅ fallback (only first time)
        if (campaignRes?.trackingMode) setTrackingMode(campaignRes.trackingMode);
        if (campaignRes?.trackingDomain) setTrackingDomain(campaignRes.trackingDomain);

        if (campaignRes?.subjectLines?.length) {
          setSubject(campaignRes.subjectLines[0]);
        }

        if (campaignRes?.fromLines?.length) {
          setFromName(campaignRes.fromLines[0]);
        }
      }

      // ✅ Creative load
      const creativeData = await campaignApi.creative(campaign);

      setCreativeOverride(
        typeof creativeData === "string"
          ? creativeData
          : JSON.stringify(creativeData, null, 2)
      );

      if (creativeData?.activeHtml) {
        setCreativeOverride(creativeData.activeHtml);
      }

    } catch {
      setError("Failed to load campaign.");
    }
  }

  if (campaign) loadCampaign();
}, [campaign]);


  useEffect(() => {
  const handleClick = () => {
    setSubjectOpen(false);
    setFromOpen(false);
  };



  window.addEventListener("click", handleClick);
  return () => window.removeEventListener("click", handleClick);
}, []);

useEffect(() => {
  if (!selectedRoutes.length) return;

  const formatted = selectedRoutes
    .map(r => `${r.vmta}=>${r.domain}=>${r.from_user}`)
    .join("\n");

  if (formatted !== bulkInput) {
    setBulkInput(formatted);
  }
}, [selectedRoutes]);

  useEffect(() => {
  if (!campaignData?.status) return;

  const interval = setInterval(async () => {
    try {
      const res = await campaignApi.liveStatus(undefined, campaign);

      if (res?.live) {
        setLiveStats({
          sent: res.live.sent,
          remaining: res.live.remaining,
          remaining_data: res.live.remainingData,
          speed_per_sec: res.live.speed,
          progress_percent: res.live.progress,
          elapsed_seconds: res.live.elapsed_seconds,
          remaining_seconds: res.live.remaining_seconds,
          status: res.status
        });
      }
    } catch (e) {
      console.log("status fetch failed");
    }
  }, 2000); // 🔥 every 2 sec

  return () => clearInterval(interval);
}, [campaignData?.status]);

useEffect(() => {
  setSuppressStats(campaignData?.suppression || null);
}, [campaignData]);

useEffect(() => {
  if (!campaignData?.status) return;

  const interval = setInterval(() => {
    reloadCampaign();
  }, 50000);

  return () => clearInterval(interval);
}, [campaignData?.status]);
  /* ================= SAVE CREATIVE ================= */
const saveCreative = async () => {
  if (!creativeOverride.trim()) {
    setError("Creative cannot be empty.");
    return;
  }

  try {
    setLoading(true);
    setError("");
    setFloatingAlert("");

    await campaignApi.saveCreative(campaign, creativeOverride);

    setFloatingAlert("✅ Creative saved successfully.");
  } catch (err: any) {
    setError(err.message || "Failed to save creative.");
  } finally {
    setLoading(false);
  }
};

  /* ================= RESET CREATIVE ================= */
const resetCreative = async () => {
  try {
    setLoading(true);
    setError("");
    setFloatingAlert("");

    await campaignApi.resetCreative(campaign);

    const fresh = await campaignApi.creative(campaign);
    setCreativeOverride(fresh?.activeHtml || "");

    setFloatingAlert("🔄 Creative reset successfully.");
  } catch (err: any) {
    setError(err.message || "Failed to reset creative.");
  } finally {
    setLoading(false);
  }
};


  const runSuppression = async () => {
    try {
      setSuppressing(true);
      setError("");
      setFloatingAlert("");

      const res = await campaignApi.suppress(campaign);

      const suppression = res?.data?.suppression || res?.suppression;

      setSuppressStats(suppression);

      setFloatingAlert("✅ Suppression completed successfully.");
      await reloadCampaign();
    } catch (err: any) {
      setError(err.message || "Suppression failed");
    } finally {
      setSuppressing(false);
    }
  };

const reloadCampaign = async () => {
  try {
    const campaignRes = await campaignApi.review(campaign);
    
    setCampaignData(campaignRes);
    setSelectedRoutes(
      Array.isArray(campaignRes?.routes) ? campaignRes.routes : []
    );
    // ✅ SAFE restore (no overwrite)
    if (campaignRes?.sendConfig) {
      const c = campaignRes.sendConfig;

      if (c.mode !== undefined) setMode(c.mode);
      if (c.trackingMode !== undefined) setTrackingMode(c.trackingMode);
      if (c.trackingDomain !== undefined) setTrackingDomain(c.trackingDomain);

      if (c.subject !== undefined) setSubject(c.subject);
      if (c.fromName !== undefined) setFromName(c.fromName);

      if (Array.isArray(c.aliases)) {
        setAliases(c.aliases.join("\n"));
      }

      if (Array.isArray(c.seeds)) {
        setSeeds(c.seeds.join(","));
      }

      if (c.totalSend !== undefined) setTotalSend(c.totalSend);

      if (c.seedAfter !== undefined) setSeedAfter(c.seedAfter);
      if (c.seedMode !== undefined) setSeedMode(c.seedMode);

      if (c.sendInSeconds !== undefined) setSendInSeconds(c.sendInSeconds);
      if (c.sendInMinutes !== undefined) setSendInMinutes(c.sendInMinutes);
      if (c.sendInHours !== undefined) setSendInHours(c.sendInHours);

      // 🔥 TEST fields (tu miss kar raha tha pehle)
      if (c.testRoutes !== undefined) setTestRoutes(c.testRoutes);
      if (c.testSeeds !== undefined) setTestSeeds(c.testSeeds);
      if (c.testTotalSend !== undefined) setTestTotalSend(c.testTotalSend);
      
    }

  } catch {
    setError("Failed to reload campaign.");
  }
};

const saveExecutionSettings = async () => {
  try {
    const payload: any = {
      mode,
      subject: subject?.trim() || undefined,
      fromName: fromName?.trim() || undefined,

      trackingMode,
      trackingDomain:
        trackingMode === "domain" ? trackingDomain.trim() : undefined,

      aliases: aliases
        ? aliases.split("\n").map(a => a.trim()).filter(Boolean)
        : undefined,

      seeds: seeds
        ? seeds.split(",").map(s => s.trim().toLowerCase()).filter(Boolean)
        : undefined,

      totalSend: totalSend || undefined,

      sendInSeconds: sendInSeconds !== "" ? sendInSeconds : undefined,
      sendInMinutes: sendInMinutes !== "" ? sendInMinutes : undefined,
      sendInHours: sendInHours !== "" ? sendInHours : undefined,

      seedAfter:
      seedAfter === "" || seedAfter === null
        ? 0
        : Number(seedAfter),

      seedMode:
      seedAfter === "" || seedAfter === null
        ? "round"
        : seedMode,

      // 🔥 TEST fields safe
      testRoutes: testRoutes !== "" ? testRoutes : undefined,
      testSeeds: testSeeds !== "" ? testSeeds : undefined,
      testTotalSend: testTotalSend !== "" ? testTotalSend : undefined,
    };

    await campaignApi.saveConfig(campaign, payload);

    setFloatingAlert("💾 Settings saved");

  } catch (err: any) {
    setError(err.message || "Failed to save settings");
  }
};

const saveRoutes = async (
  nextRoutes: Array<{ domain: string; from_user: string; vmta: string }>
) => {
  try {
    setRouteSaving(true);
    setRouteSaveError("");
    await campaignApi.saveConfig(campaign, { routes: nextRoutes });
    setCampaignData((prev) =>
      prev
        ? {
            ...prev,
            routes: nextRoutes,
          }
        : prev
    );
  } catch (err: any) {
    setRouteSaveError(err.message || "Failed to save routes");
  } finally {
    setRouteSaving(false);
  }
};

  /* ================= VALIDATION & RUN ================= */
  const validateAndConfirm = () => {
    
    if (campaignData?.status === "LIVE") {
  return setError("Campaign already running.");
}

    if (!campaignData) return setError("Campaign not loaded.");

    const seedList = seeds
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (!selectedRoutes.length) {
      return setError("Please select at least one route.");
    }

    if (mode === "TEST" && seedList.length === 0)
      return setError("Seed emails required for TEST mode.");

    if (mode === "LIVE") {
      if (!totalSend || totalSend <= 0) return setError("Invalid total send.");

      const hasTime =
        sendInSeconds !== "" ||
        sendInMinutes !== "" ||
        sendInHours !== "";
      if (!hasTime) return setError("Provide seconds, minutes, or hours.");

      if (seedAfter !== "" && seedAfter < 1)
        return setError("Seed after must be >= 1.");

      // Compute rate for display
     const calculateRate = (): number => {
  if (mode !== "LIVE" || !totalSend) return 0;

  if (sendInSeconds !== "") return totalSend / Number(sendInSeconds);
  if (sendInMinutes !== "") return totalSend / (Number(sendInMinutes) * 60);
  if (sendInHours !== "") return totalSend / (Number(sendInHours) * 3600);

  return 0;
};

const rate = calculateRate();

      const message = `
LIVE SEND CONFIRMATION

Total Emails: ${totalSend}
Estimated Rate: ${rate.toFixed(2)} emails/sec
Seed After: ${seedAfter || "No seed injection"}
Tracking Mode: ${trackingMode}

Proceed?
`;

      setConfirmConfig({ onConfirm: runCampaign, message });
      setShowConfirmModal(true);
      return;
    }
    setError("");
    setFloatingAlert("");
    // TEST mode – run directly
    runCampaign();
  };

  const runCampaign = async () => {
    setShowConfirmModal(false);

    // Re-run critical validations
    if (!campaignData) {
      setError("Campaign data missing.");
      return;
    }

    const seedList = seeds
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    // Suppression check (handle 0 correctly)
    const finalAvailable =
      suppressStats?.finalCount ??
      campaignData?.suppression?.finalCount;

    if (
      mode === "LIVE" &&
      finalAvailable !== undefined &&
      totalSend > finalAvailable
    ) {
      return setError("Total send exceeds available records.");
    }

// Normalize + clean
const normalizedSeeds = seeds
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

// Remove duplicates
const uniqueSeeds = [...new Set(normalizedSeeds)];

const emailRegex =
  /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;

// Validate
const invalidSeeds = uniqueSeeds.filter(
  (email) => !emailRegex.test(email)
);

if (invalidSeeds.length > 0) {
  setError(`Invalid seed emails: ${invalidSeeds.join(", ")}`);
  return;
}

    setLoading(true);

    // ENVELOPE VALIDATION
    if (envelopeMode === "custom") {
      if (envelopeCustomType === "fixed" && !envelopeCustomEmail.trim()) {
        setError("Envelope fixed email required.");
        setLoading(false);
        return;
      }
      if (envelopeCustomType === "pattern" && !envelopeCustomDomain.trim()) {
        setError("Envelope custom domain required.");
        setLoading(false);
        return;
      }
      if (
        envelopeCustomType === "pattern" &&
        (envelopePatternBlocks < 1 || envelopePatternLength < 1)
      ) {
        setError("Envelope pattern values must be >= 1.");
        setLoading(false);
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (envelopeCustomType === "fixed" && !emailRegex.test(envelopeCustomEmail)) {
        setError("Invalid envelope email.");
        setLoading(false);
        return;
      }
    }

    // HEADER VALIDATION
    if (headerMode === "custom") {
      if (headerCustomType === "fixed" && !headerCustomEmail.trim()) {
        setError("Header fixed email required.");
        setLoading(false);
        return;
      }
      if (headerCustomType === "pattern" && !headerCustomDomain.trim()) {
        setError("Header custom domain required.");
        setLoading(false);
        return;
      }
      if (
        headerCustomType === "pattern" &&
        (headerPatternBlocks < 1 || headerPatternLength < 1)
      ) {
        setError("Header pattern values must be >= 1.");
        setLoading(false);
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (headerCustomType === "fixed" && !emailRegex.test(headerCustomEmail)) {
        setError("Invalid header email.");
        setLoading(false);
        return;
      }
    }

    if (trackingMode === "domain" && !trackingDomain.trim()) {
      setError("Tracking domain required.");
      setLoading(false);
      return;
    }

    // Prepare payload – convert "" to undefined for number fields
    try {
      await campaignApi.run(campaign, {
        sender: campaignData.sender,
        mode,
        testRoutes: mode === "TEST" && testRoutes !== "" ? testRoutes : undefined,
        testSeeds: mode === "TEST" && testSeeds !== "" ? testSeeds : undefined,
        testTotalSend:
          mode === "TEST" && testTotalSend !== "" ? testTotalSend : undefined,
        aliases: aliases
        ? aliases
            .split(",")
            .map((a) => a.trim().toLowerCase())
            .filter(Boolean)
        : undefined,
        seeds: seedList.length ? seedList : undefined,
        totalSend: mode === "LIVE" ? totalSend : undefined,
        sendInSeconds:
          mode === "LIVE" && sendInSeconds !== ""
            ? (sendInSeconds as number)
            : undefined,
        sendInMinutes:
          mode === "LIVE" && sendInMinutes !== ""
            ? (sendInMinutes as number)
            : undefined,
        sendInHours:
          mode === "LIVE" && sendInHours !== ""
            ? (sendInHours as number)
            : undefined,
        seedAfter:
          mode === "LIVE" && seedAfter !== "" ? (seedAfter as number) : undefined,
        seedMode: mode === "LIVE" && seedAfter !== "" ? seedMode : undefined,
        trackingMode,
        trackingDomain:
          trackingMode === "domain" ? trackingDomain.trim() : undefined,
        routes: selectedRoutes,
        contentMode,
        textEncoding,
        htmlEncoding,

        // 🔥 ADD THESE (YOU MISSED THEM)
        subject: subject.trim() || undefined,
        fromName: fromName.trim() || undefined,
        headerBlockMode,
        customHeaderBlock:
          headerBlockMode === "custom"
            ? customHeaderBlock
            : undefined,

        envelopeMode,
        ...(envelopeMode === "custom" && {
          envelopeCustomType,
          ...(envelopeCustomType === "fixed" && { envelopeCustomEmail }),
          ...(envelopeCustomType === "pattern" && {
            envelopeCustomDomain,
            envelopePatternBlocks,
            envelopePatternLength,
          }),
        }),

        headerMode,
        ...(headerMode === "custom" && {
          headerCustomType,
          ...(headerCustomType === "fixed" && { headerCustomEmail }),
          ...(headerCustomType === "pattern" && {
            headerCustomDomain,
            headerPatternBlocks,
            headerPatternLength,
          }),
        }),
      });


      setFloatingAlert(`🚀 ${mode} campaign started successfully.`);

      // TEST mode me next test allow karo
      if (mode === "TEST") {
        setStarted(false);
      } else {
        setStarted(true);
      }

      await reloadCampaign();
    } catch (err: any) {
      setError(err.message || "Failed to start campaign");
    } finally {
      setLoading(false);
    }
  };

  /* ================= UI HELPERS ================= */
  if (!campaignData) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground">
        Loading campaign...
      </div>
    </div>
  );
}

  // Compute rate for display
  const rate =
    mode === "LIVE" && totalSend
      ? sendInSeconds !== ""
        ? totalSend / (sendInSeconds as number)
        : sendInMinutes !== ""
        ? totalSend / ((sendInMinutes as number) * 60)
        : sendInHours !== ""
        ? totalSend / ((sendInHours as number) * 3600)
        : 0
      : 0;


      
  return (
  <div className="min-h-screen bg-background text-foreground transition-colors">
    {floatingAlert && (
  <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999]">
    <div className="bg-emerald-600 text-white px-6 py-3 rounded-lg shadow-xl">
      {floatingAlert}
    </div>
  </div>
)}
    <div className="max-w-6xl mx-auto px-6 py-12 space-y-10">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Send Campaign
          </h1>
          <h1 className="text-3xl font-semibold tracking-tight break-all">
            {campaign}
          </h1>
        </div>
        {liveStats?.status === "RUNNING" && (
  <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-6 space-y-4">

    <div className="flex justify-between text-sm">
      <span>📤 Sent</span>
      <span>{liveStats.sent}</span>
    </div>

    <div className="flex justify-between text-sm">
      <span>📥 Remaining</span>
      <span>{liveStats.remaining}</span>
    </div>

    <div className="flex justify-between text-sm">
  <span>📊 Data Left</span>
  <span>{liveStats.remaining_data ?? 0}</span>
</div>

    <div className="flex justify-between text-sm">
      <span>⚡ Speed</span>
      <span>{liveStats.speed_per_sec} / sec</span>
    </div>

    <div className="flex justify-between text-sm">
      <span>⏱️ Elapsed</span>
      <span>{formatTime(liveStats.elapsed_seconds)}</span>
    </div>

    <div className="flex justify-between text-sm">
      <span>⏳ ETA</span>
      <span>{formatTime(liveStats.remaining_seconds)}</span>
    </div>

    {/* progress bar */}
    <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
      <div
        className="h-full bg-blue-500 transition-all"
        style={{ width: `${liveStats.progress_percent}%` }}
      />
    </div>

    <div className="text-xs text-muted-foreground text-right">
      {liveStats.progress_percent}% completed
    </div>

  </div>
)}

        <div className="flex items-center gap-4">

          <div
            className={`
              px-4 py-1.5 rounded-full text-xs font-medium border
              ${
                campaignData.status === "LIVE"
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500"
                  : "bg-muted border-border text-muted-foreground"
              }
            `}
          >
            {campaignData.status || "DRAFT"}
          </div>

          <CampaignControls
            campaign={campaignData}
            refresh={reloadCampaign}
          />

        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999]">
          <div className="bg-red-600 text-white px-6 py-3 rounded-lg shadow-xl">
            {error}
          </div>
        </div>
      )}

      {statusMessage && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-600 dark:text-emerald-400">
          {statusMessage}
        </div>
      )}

      <div className="space-y-8">
        {/* Sections go here */}

        <SectionCard>
          <CampaignInfo
            sender={campaignData.sender}
            senderServerId={campaignData.senderServerId}
            status={campaignData.status}
            runtimeOfferId={campaignData.runtimeOfferId}
            suppression={campaignData.suppression}
            routes={selectedRoutes}
          />
        </SectionCard>

        <SectionCard>
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold">Routes</h3>
              <span className="text-xs text-muted-foreground">
                {routeSaving ? "Saving..." : "Saved automatically"}
              </span>
            </div>
            {/* 🔥 BULK ROUTE INPUT */}
            <textarea
              placeholder="ip=>domain=>from_user"
              className="w-full h-32 p-3 rounded bg-black text-white border text-sm"
              value={bulkInput}
              onChange={(e) => {
                const value = e.target.value;
                setBulkInput(value);

                if (debounceTimer) clearTimeout(debounceTimer);

                const timer = setTimeout(() => {
                  const lines = value
                    .split("\n")
                    .map(l => l.trim())
                    .filter(Boolean);

                  const parsed = lines.map(line => {
                  const [vmta, domain, from_user] = line.split("=>").map(x => x.trim());
                  if (!vmta || !domain || !from_user) return null;
                  return { vmta, domain, from_user };
                }).filter((r): r is { vmta: string; domain: string; from_user: string } => !!r);

                if (!parsed.length) return;

                const unique = Array.from(
                  new Map(parsed.map(r => [`${r.vmta}-${r.domain}`, r])).values()
                );

                setSelectedRoutes(unique);
                saveRoutes(unique); // 🔥 autosave
                }, 500);

                setDebounceTimer(timer);
              }}
            />
            {routeSaveError && (
              <p className="text-sm text-destructive">{routeSaveError}</p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(campaignData.availableRoutes || []).map((route, index) => {
                const key = `${route.vmta}|${route.domain}|${route.from_user}`;
                const checked = selectedRoutes.some(
                  (r) =>
                    r.vmta === route.vmta &&
                    r.domain === route.domain &&
                    r.from_user === route.from_user
                );

                return (
                  <label
                    key={`${key}-${index}`}
                    className="flex flex-col gap-2 rounded-xl border border-border/60 bg-card/60 px-3 py-2 cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          setSelectedRoutes((prev) => {
                            let nextRoutes = prev;
                            if (e.target.checked) {
                              nextRoutes = [
                                ...prev,
                                {
                                  vmta: route.vmta,
                                  domain: route.domain,
                                  from_user: route.from_user,
                                },
                              ];
                            } else {
                              nextRoutes = prev.filter(
                                (r) =>
                                  !(
                                    r.vmta === route.vmta &&
                                    r.domain === route.domain &&
                                    r.from_user === route.from_user
                                  )
                              );
                            }

                            saveRoutes(nextRoutes);
                            return nextRoutes;
                          });
                        }}
                      />

                      <span className="text-sm text-muted-foreground">
                        {route.vmta} | {route.domain}
                      </span>
                    </div>

                    {/* 🔥 YAHI ADD KARNA HAI */}
                    {checked && (
                      <input
                        type="text"
                        placeholder="Enter From Email"
                        className="w-full px-2 py-1 rounded bg-black text-white border text-sm"
                        value={
                          selectedRoutes.find(
                            (r) =>
                              r.vmta === route.vmta &&
                              r.domain === route.domain
                          )?.from_user || ""
                        }
                        onChange={(e) => {
                          const updated = selectedRoutes.map((r) =>
                            r.vmta === route.vmta &&
                            r.domain === route.domain
                              ? { ...r, from_user: e.target.value }
                              : r
                          );

                          setSelectedRoutes(updated);
                          saveRoutes(updated); // 🔥 autosave
                        }}
                      />
                    )}
                  </label>
                );
              })}
            </div>
            {!campaignData.availableRoutes?.length && (
              <p className="text-sm text-muted-foreground">
                No active routes found on sender.
              </p>
            )}
          </div>
        </SectionCard>

        <SectionCard>
          <CreativeEditor
            creativeOverride={creativeOverride}
            setCreativeOverride={setCreativeOverride}
            onSave={saveCreative}
            onReset={resetCreative}
            loading={loading}
          />
        </SectionCard>

        <SectionCard>
          <ExecutionSettings
            campaign={campaignData}
            mode={mode}
            setMode={setMode}
            trackingMode={trackingMode}
            aliases={aliases}
            setAliases={setAliases}
            setTrackingMode={setTrackingMode}
            testRoutes={testRoutes}
            setTestRoutes={setTestRoutes}
            testSeeds={testSeeds}
            setTestSeeds={setTestSeeds}
            testTotalSend={testTotalSend}
            setTestTotalSend={setTestTotalSend}
            trackingDomain={trackingDomain}
            setTrackingDomain={setTrackingDomain}
            subject={subject}
            setSubject={setSubject}
            subjectOpen={subjectOpen}
            setSubjectOpen={setSubjectOpen}
            subjectQuery={subjectQuery}
            setSubjectQuery={setSubjectQuery}
            filteredSubjects={filteredSubjects}
            fromName={fromName}
            setFromName={setFromName}
            fromOpen={fromOpen}
            setFromOpen={setFromOpen}
            fromQuery={fromQuery}
            setFromQuery={setFromQuery}
            filteredFrom={filteredFrom}
            seeds={seeds}
            setSeeds={setSeeds}
            totalSend={totalSend}
            setTotalSend={setTotalSend}
            seedAfter={seedAfter}
            setSeedAfter={setSeedAfter}
            seedMode={seedMode}
            setSeedMode={setSeedMode}
            sendInSeconds={sendInSeconds}
            setSendInSeconds={setSendInSeconds}
            sendInMinutes={sendInMinutes}
            setSendInMinutes={setSendInMinutes}
            sendInHours={sendInHours}
            setSendInHours={setSendInHours}
            rate={rate}
            suppressing={suppressing}
            suppressed={suppressed}
            suppressStats={suppressStats}
            runSuppression={runSuppression}
            reloadCampaign={reloadCampaign}
            onSave={saveExecutionSettings}
          />
        </SectionCard>

        <SectionCard>
          <FormatSettings
            formatOpen={formatOpen}
            setFormatOpen={setFormatOpen}
            contentMode={contentMode}
            setContentMode={setContentMode}
            textEncoding={textEncoding}
            setTextEncoding={setTextEncoding}
            htmlEncoding={htmlEncoding}
            setHtmlEncoding={setHtmlEncoding}
          />
        </SectionCard>

        <SectionCard>
          <AdvancedHeaderSettings
            headerAdvancedOpen={headerAdvancedOpen}
            setHeaderAdvancedOpen={setHeaderAdvancedOpen}
            headerBlockMode={headerBlockMode}
            setHeaderBlockMode={setHeaderBlockMode}
            customHeaderBlock={customHeaderBlock}
            setCustomHeaderBlock={setCustomHeaderBlock}
            envelopeMode={envelopeMode}
            setEnvelopeMode={setEnvelopeMode}
            envelopeCustomType={envelopeCustomType}
            setEnvelopeCustomType={setEnvelopeCustomType}
            envelopeCustomEmail={envelopeCustomEmail}
            setEnvelopeCustomEmail={setEnvelopeCustomEmail}
            envelopeCustomDomain={envelopeCustomDomain}
            setEnvelopeCustomDomain={setEnvelopeCustomDomain}
            envelopePatternBlocks={envelopePatternBlocks}
            setEnvelopePatternBlocks={setEnvelopePatternBlocks}
            envelopePatternLength={envelopePatternLength}
            setEnvelopePatternLength={setEnvelopePatternLength}
            headerMode={headerMode}
            setHeaderMode={setHeaderMode}
            headerCustomType={headerCustomType}
            setHeaderCustomType={setHeaderCustomType}
            headerCustomEmail={headerCustomEmail}
            setHeaderCustomEmail={setHeaderCustomEmail}
            headerCustomDomain={headerCustomDomain}
            setHeaderCustomDomain={setHeaderCustomDomain}
            headerPatternBlocks={headerPatternBlocks}
            setHeaderPatternBlocks={setHeaderPatternBlocks}
            headerPatternLength={headerPatternLength}
            setHeaderPatternLength={setHeaderPatternLength}
          />
        </SectionCard>

        <div className="pt-6">
          <RunButton
            mode={mode}
            loading={loading}
            started={started}
            suppressed={suppressed}
            onClick={validateAndConfirm}
          />
        </div>

      </div>

      <ConfirmModal
        visible={showConfirmModal}
        message={confirmConfig?.message || ""}
        onCancel={() => setShowConfirmModal(false)}
        onConfirm={confirmConfig?.onConfirm || (() => {})}
      />
    </div>
  </div>
);
}

/* ================= ENHANCED STYLES (unchanged) ================= */


function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-8 shadow-sm transition-colors">
      {children}
    </div>
  );
}



function formatTime(sec: number) {
  if (!sec) return "0s";

  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;

  return `${h}h ${m}m ${s}s`;
}