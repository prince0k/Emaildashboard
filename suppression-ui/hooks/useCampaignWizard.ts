import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import api from "@/lib/api";

type SegmentSelection = { filename: string; limit: number; direction?: string };

export function useCampaignWizard(campaignId: string | null) {
  const router = useRouter();
  const pathname = usePathname();

  const [step, setStep] = useState(1);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);

  const [isManualName, setIsManualName] = useState(false);
  const [isManualRuntimeId, setIsManualRuntimeId] = useState(false);

  const [localCampaignId, setLocalCampaignId] = useState<string | null>(campaignId);
  const loadedCampaignIdRef = useRef<string | null>(null);
  const rawRoutesRef = useRef<any[]>([]);

  const requestInFlightRef = useRef(false);
  const latestRequestIdRef = useRef(0);

  const persistCampaignId = (newId: string) => {
    setLocalCampaignId(newId);
    loadedCampaignIdRef.current = newId;
    
    // Preserve other search parameters when updating 'id'
    const searchParams = new URLSearchParams(window.location.search);
    searchParams.set("id", newId);
    router.replace(`${pathname}?${searchParams.toString()}`, { scroll: false });
  };

  const [form, setForm] = useState({
    sender: "",
    campaignName: "",
    creativeId: "",
    offerId: "",
    isp: "Yahoo",
    segmentName: "",
    routeIds: [] as string[],
    testEmails: [] as string[],
    subjectIds: [] as string[],
    fromIds: [] as string[],
    runtimeOfferId: "",
    trackingMode: "from",
    trackingDomain: "",
    scheduledDate: "",
    headerMode: "default",
    customHeaderBlock: "Date: {date}\nFrom: {fromName} <{fromEmail}>\nTo: <{to}>\nReply-To: {replyTo}\nSubject: {subject}\nMessage-ID: {mid}\nMIME-Version: 1.0\nList-Unsubscribe: <{listUnsubUrl}>\nList-Unsubscribe-Post: List-Unsubscribe=One-Click\nContent-Type: multipart/alternative; boundary=\"{boundary}\"\nX-virtual-MTA: {vmta}",
    textEncoding: "base64",
    htmlEncoding: "base64",
    totalSend: 0,
    sendInSeconds: "" as number | "",
    sendInMinutes: "" as number | "",
    sendInHours: "" as number | "",
    seeds: "",
    seedAfter: "" as number | "",
    seedMode: "round" as "round" | "random",
  });

  const [servers, setServers] = useState<any[]>([]);
  const [offers, setOffers] = useState<any[]>([]);
  const [segments, setSegments] = useState<any[]>([]);
  const [creatives, setCreatives] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [fromLines, setFromLines] = useState<any[]>([]);
  const [testIds, setTestIds] = useState<any[]>([]);

  const [suppressionConfig, setSuppressionConfig] = useState({
    queueDomain: "" as string,
    skipUnsub: false,
    inclusionSegments: [] as SegmentSelection[],
    exclusionSegments: [] as SegmentSelection[],
  });
  const [suppressionResult, setSuppressionResult] = useState<any>(null);
  const [suppressing, setSuppressing] = useState(false);

  const [htmlOverride, setHtmlOverride] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [loading, setLoading] = useState(false);
  const [currentTestIndex, setCurrentTestIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const lastSyncedCreativeId = useRef<string | null>(null);

  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [isFullscreen]);

  useEffect(() => {
    async function loadInitial() {
      try {
        const [serversRes, offersRes, segmentsRes, testRes] = await Promise.all([
          api.get("/senders"),
          api.get("/offers"),
          api.get("/segments/list"),
          api.get("/test-ids"),
        ]);
        setServers(serversRes.data?.senders || []);
        setOffers(offersRes.data || []);
        setSegments(Array.isArray(segmentsRes.data) ? segmentsRes.data : segmentsRes.data?.segments || []);
        setTestIds(testRes.data?.testIds || []);
      } catch (err: any) {
        setError("Failed to load initial data: " + (err.response?.data?.error || err.message));
      }
    }
    loadInitial();
  }, []);

  useEffect(() => {
    if (campaignId) {
      if (campaignId !== loadedCampaignIdRef.current) {
        async function loadDraft() {
          try {
            const res = await api.get(`/campaigns/id/${campaignId}`);
            const c = res.data.data;
            rawRoutesRef.current = c.routes || [];
            setForm({
              sender: c.sender?._id || "",
              campaignName: c.campaignName || "",
              creativeId: c.creativeId?._id || "",
              offerId: c.offerId?._id || "",
              isp: c.isp || "Yahoo",
              segmentName: c.segmentName || "",
              routeIds: [],
              testEmails: c.testEmails || [],
              subjectIds: c.sendConfig?.subjectIds || [],
              fromIds: c.sendConfig?.fromIds || [],
              runtimeOfferId: c.runtimeOfferId || "",
              trackingMode: c.trackingMode || "from",
              trackingDomain: c.trackingDomain || "",
              scheduledDate: c.scheduledAt ? new Date(c.scheduledAt).toISOString().split("T")[0] : "",
              headerMode: c.sendConfig?.headerBlockMode || "default",
              customHeaderBlock: c.sendConfig?.customHeaderBlock || "Date: {date}\nFrom: {fromName} <{fromEmail}>\nTo: <{to}>\nReply-To: {replyTo}\nSubject: {subject}\nMessage-ID: {mid}\nMIME-Version: 1.0\nList-Unsubscribe: <{listUnsubUrl}>\nList-Unsubscribe-Post: List-Unsubscribe=One-Click\nContent-Type: multipart/alternative; boundary=\"{boundary}\"\nX-virtual-MTA: {vmta}",
              textEncoding: c.sendConfig?.textEncoding || "base64",
              htmlEncoding: c.sendConfig?.htmlEncoding || "base64",
              totalSend: c.sendConfig?.totalSend || 0,
              sendInSeconds: c.sendConfig?.sendInSeconds !== undefined && c.sendConfig?.sendInSeconds !== null ? Number(c.sendConfig?.sendInSeconds) : "",
              sendInMinutes: c.sendConfig?.sendInMinutes !== undefined && c.sendConfig?.sendInMinutes !== null ? Number(c.sendConfig?.sendInMinutes) : "",
              sendInHours: c.sendConfig?.sendInHours !== undefined && c.sendConfig?.sendInHours !== null ? Number(c.sendConfig?.sendInHours) : "",
              seeds: Array.isArray(c.sendConfig?.seeds) ? c.sendConfig?.seeds.join(", ") : "",
              seedAfter: c.sendConfig?.seedAfter !== undefined && c.sendConfig?.seedAfter !== null ? Number(c.sendConfig?.seedAfter) : "",
              seedMode: c.sendConfig?.seedMode || "round",
            });
            if (c.campaignName) setIsManualName(true);
            if (c.runtimeOfferId) setIsManualRuntimeId(true);
            if (c.htmlOverride) {
              setHtmlOverride(c.htmlOverride);
            }
            if (c.suppressionConfig) {
              setSuppressionConfig({
                queueDomain: c.suppressionConfig.queueDomain || "",
                skipUnsub: c.suppressionConfig.skipUnsub || false,
                inclusionSegments: c.suppressionConfig.inclusionSegments || [],
                exclusionSegments: c.suppressionConfig.exclusionSegments || [],
              });
            }
            if (c.suppression) {
              setSuppressionResult(c.suppression);
            }
            loadedCampaignIdRef.current = campaignId;
            setLocalCampaignId(campaignId);
          } catch (err: any) {
            setError("Failed to load draft: " + (err.response?.data?.error || err.message));
          }
        }
        loadDraft();
      }
    } else {
      // Check if we have copyCampaignData in localStorage
      const copyDataStr = typeof window !== "undefined" ? localStorage.getItem("copyCampaignData") : null;
      if (copyDataStr) {
        try {
          const c = JSON.parse(copyDataStr);
          localStorage.removeItem("copyCampaignData");
          rawRoutesRef.current = c.routes || [];

          setForm({
            sender: c.sender?._id || c.sender || "",
            campaignName: c.campaignName || "",
            creativeId: c.creativeId?._id || c.creativeId || "",
            offerId: c.offerId?._id || c.offerId || "",
            isp: c.isp || "Yahoo",
            segmentName: c.segmentName || "",
            routeIds: [],
            testEmails: c.testEmails || [],
            subjectIds: c.sendConfig?.subjectIds || [],
            fromIds: c.sendConfig?.fromIds || [],
            runtimeOfferId: c.runtimeOfferId || "",
            trackingMode: c.trackingMode || "from",
            trackingDomain: c.trackingDomain || "",
            scheduledDate: "", // Always reset on copy
            headerMode: c.sendConfig?.headerBlockMode || "default",
            customHeaderBlock: c.sendConfig?.customHeaderBlock || "Date: {date}\nFrom: {fromName} <{fromEmail}>\nTo: <{to}>\nReply-To: {replyTo}\nSubject: {subject}\nMessage-ID: {mid}\nMIME-Version: 1.0\nList-Unsubscribe: <{listUnsubUrl}>\nList-Unsubscribe-Post: List-Unsubscribe=One-Click\nContent-Type: multipart/alternative; boundary=\"{boundary}\"\nX-virtual-MTA: {vmta}",
            textEncoding: c.sendConfig?.textEncoding || "base64",
            htmlEncoding: c.sendConfig?.htmlEncoding || "base64",
            totalSend: c.sendConfig?.totalSend || 0,
            sendInSeconds: c.sendConfig?.sendInSeconds !== undefined && c.sendConfig?.sendInSeconds !== null ? Number(c.sendConfig?.sendInSeconds) : "",
            sendInMinutes: c.sendConfig?.sendInMinutes !== undefined && c.sendConfig?.sendInMinutes !== null ? Number(c.sendConfig?.sendInMinutes) : "",
            sendInHours: c.sendConfig?.sendInHours !== undefined && c.sendConfig?.sendInHours !== null ? Number(c.sendConfig?.sendInHours) : "",
            seeds: Array.isArray(c.sendConfig?.seeds) ? c.sendConfig?.seeds.join(", ") : "",
            seedAfter: c.sendConfig?.seedAfter !== undefined && c.sendConfig?.seedAfter !== null ? Number(c.sendConfig?.seedAfter) : "",
            seedMode: c.sendConfig?.seedMode || "round",
          });

          if (c.campaignName) setIsManualName(true);
          if (c.runtimeOfferId) setIsManualRuntimeId(true);
          if (c.htmlOverride) {
            setHtmlOverride(c.htmlOverride);
          }
          if (c.suppressionConfig) {
            setSuppressionConfig({
              queueDomain: c.suppressionConfig.queueDomain || "",
              skipUnsub: c.suppressionConfig.skipUnsub || false,
              inclusionSegments: c.suppressionConfig.inclusionSegments || [],
              exclusionSegments: c.suppressionConfig.exclusionSegments || [],
            });
          }
        } catch (err) {
          console.error("Failed to parse copyCampaignData:", err);
        }
      } else if (loadedCampaignIdRef.current !== null) {
        loadedCampaignIdRef.current = null;
        setLocalCampaignId(null);
        setStep(1);
        setIsManualName(false);
        setIsManualRuntimeId(false);
        setHtmlOverride("");
        setSuppressionResult(null);
        setForm({
          sender: "",
          campaignName: "",
          creativeId: "",
          offerId: "",
          isp: "Yahoo",
          segmentName: "",
          routeIds: [],
          testEmails: [],
          subjectIds: [],
          fromIds: [],
          runtimeOfferId: "",
          trackingMode: "from",
          trackingDomain: "",
          scheduledDate: "",
          headerMode: "default",
          customHeaderBlock: "Date: {date}\nFrom: {fromName} <{fromEmail}>\nTo: <{to}>\nReply-To: {replyTo}\nSubject: {subject}\nMessage-ID: {mid}\nMIME-Version: 1.0\nList-Unsubscribe: <{listUnsubUrl}>\nList-Unsubscribe-Post: List-Unsubscribe=One-Click\nContent-Type: multipart/alternative; boundary=\"{boundary}\"\nX-virtual-MTA: {vmta}",
          textEncoding: "base64",
          htmlEncoding: "base64",
          totalSend: 0,
          sendInSeconds: "",
          sendInMinutes: "",
          sendInHours: "",
          seeds: "",
          seedAfter: "",
          seedMode: "round",
        });
        setSuppressionConfig({
          queueDomain: "",
          skipUnsub: false,
          inclusionSegments: [],
          exclusionSegments: [],
        });
      }
    }
  }, [campaignId]);

  useEffect(() => {
    if (rawRoutesRef.current.length > 0 && servers.length > 0) {
      if (form.sender) {
        const server = servers.find((s: any) => s._id === form.sender);
        if (server) {
          const resolvedIds: string[] = [];
          if (Array.isArray(server.routes)) {
            for (const rawRoute of rawRoutesRef.current) {
              const matchedRoute = server.routes.find(
                (r: any) => r.vmta === rawRoute.vmta && r.domain === rawRoute.domain
              );
              if (matchedRoute) {
                resolvedIds.push(matchedRoute._id);
              }
            }
          }
          if (resolvedIds.length > 0) {
            setForm(prev => ({
              ...prev,
              routeIds: resolvedIds
            }));
          }
          rawRoutesRef.current = [];
        }
      }
    }
  }, [servers, form.sender]);

  useEffect(() => {
    if (!form.sender || !form.offerId || !form.isp) return;
    const offer = offers.find(o => o._id === form.offerId);
    const server = servers.find(s => s._id === form.sender);

    if (offer && server) {
      const now = new Date();
      const dateStr = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}`;
      const srvCode = server.name.toLowerCase().replace(/[^a-z0-9]/g, "");
      const offerNameClean = offer.offer.toLowerCase().replace(/[^a-z0-9]/g, "_").replace(/_+/g, "_").slice(0, 20);
      const generatedName = `${form.isp.toLowerCase()}_${offerNameClean}_${offer.sid}_${offer.cid}_${dateStr}_by_usr00001_srv_${srvCode}_v1`;
      const generatedRuntimeId = `${srvCode}_${offer.sid}_${offer.cid}_${generatedName}_1`.toLowerCase();

      setForm(prev => ({
        ...prev,
        campaignName: isManualName ? prev.campaignName : generatedName,
        runtimeOfferId: isManualRuntimeId ? prev.runtimeOfferId : generatedRuntimeId
      }));
    }
  }, [form.sender, form.offerId, form.isp, offers, servers, isManualName, isManualRuntimeId]);

  useEffect(() => {
    if (!form.offerId) return;
    async function loadAssets() {
      try {
        const [creativesRes, subjectsRes, fromsRes] = await Promise.all([
          api.get(`/offers/creatives/list?offerId=${form.offerId}`),
          api.get(`/offers/subject-lines/list?offerId=${form.offerId}`),
          api.get(`/offers/from-lines/list?offerId=${form.offerId}`),
        ]);
        setCreatives(creativesRes.data || []);
        setSubjects(subjectsRes.data || []);
        setFromLines(fromsRes.data || []);
      } catch (err) {
        console.error("Failed to load offer assets");
      }
    }
    loadAssets();
  }, [form.offerId]);

  useEffect(() => {
    if (form.creativeId) {
      if (form.creativeId === lastSyncedCreativeId.current) return;
      const selected = creatives.find(c => c._id === form.creativeId);
      if (selected) {
        if (htmlOverride && lastSyncedCreativeId.current === null) {
          lastSyncedCreativeId.current = form.creativeId;
          return;
        }
        setHtmlOverride(selected.html || "");
        lastSyncedCreativeId.current = form.creativeId;
      }
    } else {
      lastSyncedCreativeId.current = null;
    }
  }, [form.creativeId, creatives, htmlOverride]);

  const toggleSelection = (id: string, field: "routeIds" | "subjectIds" | "fromIds") => {
    setForm(prev => ({
      ...prev,
      [field]: prev[field].includes(id)
        ? prev[field].filter(x => x !== id)
        : [...prev[field], id]
    }));
  };

  const formatHTML = () => {
    let html = htmlOverride || "";
    let formatted = '';
    let indent = '';
    const tab = '  ';
    html.split(/>\s*</).forEach(function (element) {
      if (element.match(/^\/\w/)) {
        indent = indent.substring(tab.length);
      }
      formatted += indent + '<' + element + '>\r\n';
      if (element.match(/^<?\w[^>]*[^\/]$/) && !element.startsWith("input") && !element.startsWith("img") && !element.startsWith("br") && !element.startsWith("hr")) {
        indent += tab;
      }
    });
    setHtmlOverride(formatted.substring(1, formatted.length - 3));
  };

  const handleSaveDraft = async () => {
    if (requestInFlightRef.current) return;
    requestInFlightRef.current = true;
    setLoading(true);
    setError(null);
    const reqId = ++latestRequestIdRef.current;
    try {
      const payload = { ...form, campaignId: localCampaignId, draft: true, isDraft: true, htmlOverride, suppressionConfig, step, requestSource: "save" };
      const res = await api.post("/campaigns/create", payload);
      if (reqId !== latestRequestIdRef.current) return;
      alert(`✅ Campaign "${res.data.campaign}" saved as draft!`);
      if (res.data.campaignId) {
        persistCampaignId(res.data.campaignId);
      }
    } catch (err: any) {
      if (reqId !== latestRequestIdRef.current) return;
      const errorMsg = err.response?.data?.error || err.response?.data?.message || err.message;
      let userFriendlyMsg = errorMsg;
      if (errorMsg === "campaign_name_already_exists") {
        userFriendlyMsg = "A campaign with this name already exists and is active or completed! Please go back to Step 1 and choose a unique Campaign Name.";
      }
      console.error("Save Draft Error:", errorMsg, err);
      setError(userFriendlyMsg || "Failed to save draft");
      alert("Save Draft failed: " + (userFriendlyMsg || "Failed to save draft"));
    } finally {
      if (reqId === latestRequestIdRef.current) {
        setLoading(false);
      }
      requestInFlightRef.current = false;
    }
  };

  const saveRef = useRef(handleSaveDraft);
  useEffect(() => {
    saveRef.current = handleSaveDraft;
  }, [handleSaveDraft]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveRef.current();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleTestFire = async () => {
    if (!form.sender || form.testEmails.length === 0) {
      alert("Please select a Sender and at least one Test ID");
      return;
    }
    setLoading(true);
    let successCount = 0;
    let failCount = 0;
    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    try {
      for (let i = 0; i < form.testEmails.length; i++) {
        const email = form.testEmails[i];
        setCurrentTestIndex(i + 1);
        if (i > 0) await sleep(5000);

        try {
          await api.post("/campaigns/test-fire", {
            ...form,
            email,
            senderId: form.sender,
          });
          successCount++;
        } catch (err) {
          failCount++;
          console.error(`Test fire failed for ${email}`, err);
        }
      }
      alert(`Safety Fire Complete: ${successCount} sent, ${failCount} failed.`);
    } catch (err) {
      console.error("Test fire failed", err);
    } finally {
      setLoading(false);
      setCurrentTestIndex(null);
    }
  };

  const handleSubmit = async () => {
    if (requestInFlightRef.current) return;
    requestInFlightRef.current = true;
    setLoading(true);
    setError(null);
    const reqId = ++latestRequestIdRef.current;
    try {
      const launchPayload = {
        ...form,
        campaignId: localCampaignId,
        htmlOverride,
        suppressionConfig,
        step,
        requestSource: "submit",
      };

      await api.post("/campaigns/launch", launchPayload);
      if (reqId !== latestRequestIdRef.current) return;
      alert("🚀 Campaign launched and sending started successfully!");

      // Replaced window.location.href with router.push so launching a campaign
      // routes back to /campaigns without triggering a hard browser reload.
      router.push("/campaigns");
    } catch (err: any) {
      if (reqId !== latestRequestIdRef.current) return;
      const errorMsg = err.response?.data?.error || err.response?.data?.message || err.message;
      let userFriendlyMsg = errorMsg;
      if (errorMsg === "run_suppression_first") userFriendlyMsg = "Suppression has not been run or completed successfully! Please make sure to go back to Step 3 and click 'Run Suppression' first.";
      else if (errorMsg === "invalid_send_time") userFriendlyMsg = "Invalid send speed/throttle configuration! Please specify Seconds, Minutes, or Hours in Step 4.";
      else if (errorMsg === "invalid_total_send") userFriendlyMsg = "Total Send Count is missing or invalid in Step 4!";
      else if (errorMsg === "campaign_routes_missing") userFriendlyMsg = "No routes are selected or configured for this campaign! Please go back to Step 1 and select at least one route.";
      else if (errorMsg === "invalid_seed_after") userFriendlyMsg = "Invalid 'Seed After' count! Please specify a positive number greater than 0, or leave it blank.";
      else if (errorMsg === "seeds_required_for_seed_after") userFriendlyMsg = "Seed emails are required in Step 4 if you configure 'Seed After' rate!";
      else if (errorMsg === "campaign_name_already_exists") userFriendlyMsg = "A campaign with this name already exists and is active or completed! Please go back to Step 1 and choose a unique Campaign Name.";
      
      setError(userFriendlyMsg);
      alert(`❌ Launch Failed:\n\n${userFriendlyMsg}`);
    } finally {
      if (reqId === latestRequestIdRef.current) {
        setLoading(false);
      }
      requestInFlightRef.current = false;
    }
  };

  const handleRunSuppression = async () => {
    if (!form.campaignName) {
      alert("Save campaign first before running suppression.");
      return;
    }
    if (suppressing || requestInFlightRef.current) return;
    requestInFlightRef.current = true;
    setSuppressing(true);
    const reqId = ++latestRequestIdRef.current;
    try {
      const resCreate = await api.post("/campaigns/create", { ...form, campaignId: localCampaignId, htmlOverride, suppressionConfig, draft: true, isDraft: true, step, requestSource: "suppression" });
      if (reqId !== latestRequestIdRef.current) return;
      if (resCreate.data.campaignId) {
        persistCampaignId(resCreate.data.campaignId);
      }
      const res = await api.post(`/campaigns/${encodeURIComponent(form.campaignName)}/suppress`);
      if (reqId !== latestRequestIdRef.current) return;
      setSuppressionResult(res.data.suppression);
    } catch (err: any) {
      if (reqId !== latestRequestIdRef.current) return;
      const errorMsg = err.response?.data?.error || err.response?.data?.message || err.message;
      let userFriendlyMsg = errorMsg;
      if (errorMsg === "campaign_name_already_exists") {
        userFriendlyMsg = "A campaign with this name already exists and is active or completed! Please go back to Step 1 and choose a unique Campaign Name.";
      }
      console.error("Suppression Error:", errorMsg, err);
      alert("Suppression failed: " + (userFriendlyMsg || "Failed to run suppression"));
    } finally {
      if (reqId === latestRequestIdRef.current) {
        setSuppressing(false);
      }
      requestInFlightRef.current = false;
    }
  };

  const currentServer = servers.find(s => s._id === form.sender);

  return {
    step, setStep,
    form, setForm,
    servers, currentServer,
    offers, segments, testIds, creatives, subjects, fromLines,
    suppressionConfig, setSuppressionConfig,
    suppressionResult, setSuppressionResult,
    suppressing, handleRunSuppression,
    htmlOverride, setHtmlOverride, formatHTML,
    isFullscreen, setIsFullscreen,
    showPreview, setShowPreview,
    showAdvanced, setShowAdvanced,
    loading, currentTestIndex, error,
    setIsManualName, setIsManualRuntimeId,
    toggleSelection, handleSaveDraft, handleTestFire, handleSubmit,
    editorRef, gutterRef
  };
}
