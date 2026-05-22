import express from "express";
import Campaign from "../../models/Campaign.js";
import Creative from "../../models/Creative.js";

import suppressCampaign from "./suppressCampaign.js";
import createCampaign from "./createCampaign.js";
import reviewCampaign from "./reviewCampaign.js";
import runCampaign from "./runCampaign.js";
import campaignStatus from "./campaignStatus.js";
import copyCampaign from "./copyCampaign.js";
import controlCampaign from "./controlCampaign.js";
import listCampaigns from "./listCampaigns.js";
import analytics from "./analytics.js";
import liveStatus from "./liveStatus.js";
import campaignAnalytics from "./campaignAnalytics.js";
import saveExecutionSettings from "./saveExecutionSettings.js";
import deleteCampaign from "./deleteCampaign.js";
import testFire from "./testFire.js";
import { validateTransition } from "./helpers/validateTransition.js";

const router = express.Router();

/* ==============================
   🔥 LOAD CAMPAIGN MIDDLEWARE
============================== */

async function loadCampaign(req, res, next) {
  try {
    const campaignName = decodeURIComponent(req.params.campaign).trim();

    const campaignDoc = await Campaign.findOne({
      campaignName,
    });

    if (!campaignDoc) {
      return res.status(404).json({ error: "campaign_not_found" });
    }

    req.campaignDoc = campaignDoc;
    req.campaignName = campaignName;

    next();
  } catch (err) {
    console.error("LOAD CAMPAIGN ERROR:", err);
    return res.status(500).json({ error: "campaign_load_failed" });
  }
}

/* ==============================
   🔥 BASE ROUTES (IMPORTANT ORDER)
============================== */

import getCampaign from "./getCampaign.js";
import launchCampaign from "./launchCampaign.js";

router.get("/", listCampaigns);
router.get("/analytics", analytics);
router.get("/id/:id", getCampaign); // 🔥 Authentication is already applied in api.js

router.post("/create", createCampaign);
router.post("/launch", launchCampaign);
router.post("/copy", copyCampaign);
router.post("/delete", deleteCampaign);
router.post("/test-fire", testFire);
router.get("/live-status", liveStatus);
/* ==============================
   🔥 CAMPAIGN ACTION ROUTES
============================== */

router.get("/:campaign/review", loadCampaign, reviewCampaign);
router.post("/:campaign/run", loadCampaign, runCampaign);
router.post("/:campaign/suppress", loadCampaign, suppressCampaign);
router.get("/:campaign/status", loadCampaign, campaignStatus);
router.post("/:campaign/control", loadCampaign, controlCampaign);
router.get("/:campaign/analytics", loadCampaign, campaignAnalytics);
router.get("/:campaign/live", loadCampaign, liveStatus);
router.post("/:campaign/save-config", loadCampaign, saveExecutionSettings);

/* ==============================
   🔥 CREATIVE (FROM MONGODB)
   Fully transactional — no sender filesystem calls
============================== */

router.get("/:campaign/creative", loadCampaign, async (req, res) => {
  try {
    const campaignDoc = req.campaignDoc;
    let activeHtml = "";
    let originalHtml = "";

    // Read creative from MongoDB
    if (campaignDoc.htmlOverride) {
      activeHtml = campaignDoc.htmlOverride;
    }

    if (campaignDoc.creativeId) {
      const creativeDoc = await Creative.findById(campaignDoc.creativeId).lean();
      if (creativeDoc?.html) {
        originalHtml = creativeDoc.html;
        if (!activeHtml) {
          activeHtml = creativeDoc.html;
        }
      }
    }

    res.json({ activeHtml, originalHtml: originalHtml || activeHtml });
  } catch (err) {
    console.error("LOAD CREATIVE ERROR:", err);
    res.status(500).json({ error: "creative_load_failed" });
  }
});

router.post("/:campaign/creative", loadCampaign, async (req, res) => {
  try {
    const { html } = req.body;

    if (!html || typeof html !== "string") {
      return res.status(400).json({ error: "html_required" });
    }

    // Save creative override to MongoDB
    req.campaignDoc.htmlOverride = html.trim();
    await req.campaignDoc.save();

    res.json({ status: "updated" });
  } catch (err) {
    console.error("UPDATE CREATIVE ERROR:", err);
    res.status(500).json({ error: "creative_update_failed" });
  }
});

router.post("/:campaign/creative/reset", loadCampaign, async (req, res) => {
  try {
    const campaignDoc = req.campaignDoc;

    // Reset by clearing htmlOverride — worker will use original creative
    campaignDoc.htmlOverride = null;
    await campaignDoc.save();

    // Return the original creative HTML
    let originalHtml = "";
    if (campaignDoc.creativeId) {
      const creativeDoc = await Creative.findById(campaignDoc.creativeId).lean();
      if (creativeDoc?.html) {
        originalHtml = creativeDoc.html;
      }
    }

    res.json({ status: "reset", activeHtml: originalHtml });
  } catch (err) {
    console.error("RESET CREATIVE ERROR:", err);
    res.status(500).json({ error: "creative_reset_failed" });
  }
});

/* ==============================
   🔥 CONTROL ACTIONS (DB-ONLY)
   Worker polls campaign.status from MongoDB
============================== */

router.post("/:campaign/pause", loadCampaign, async (req, res) => {
  try {
    const campaignDoc = req.campaignDoc;

    if (!validateTransition(campaignDoc.status, "PAUSED")) {
      return res.status(400).json({ error: "invalid_transition" });
    }

    campaignDoc.status = "PAUSED";
    campaignDoc.execution = campaignDoc.execution || {};
    campaignDoc.execution.lastStatusUpdate = new Date();
    await campaignDoc.save();

    res.json({ status: "paused" });
  } catch (err) {
    res.status(500).json({ error: "pause_failed" });
  }
});

router.post("/:campaign/resume", loadCampaign, async (req, res) => {
  try {
    const campaignDoc = req.campaignDoc;
    const {
      totalSend,
      sendInSeconds,
      sendInMinutes,
      sendInHours,
    } = req.body || {};

    if (!validateTransition(campaignDoc.status, "RUNNING")) {
      return res.status(400).json({ error: "invalid_transition" });
    }

    const parsePositiveInt = (value) => {
      if (value === undefined || value === null || value === "") return null;
      const parsed = parseInt(value, 10);
      return Number.isNaN(parsed) || parsed <= 0 ? "INVALID" : parsed;
    };

    const parsedTotalSend = parsePositiveInt(totalSend);
    const parsedSendInSeconds = parsePositiveInt(sendInSeconds);
    const parsedSendInMinutes = parsePositiveInt(sendInMinutes);
    const parsedSendInHours = parsePositiveInt(sendInHours);

    if (
      parsedTotalSend === "INVALID" ||
      parsedSendInSeconds === "INVALID" ||
      parsedSendInMinutes === "INVALID" ||
      parsedSendInHours === "INVALID"
    ) {
      return res.status(400).json({ error: "invalid_resume_send_config" });
    }

    const runtimeConfig = {};

    // Prefer explicit resume payload, fallback to previously saved sendConfig.
    const effectiveTotalSend =
      parsedTotalSend ?? campaignDoc.sendConfig?.totalSend ?? null;
    const effectiveSendInSeconds =
      parsedSendInSeconds ?? campaignDoc.sendConfig?.sendInSeconds ?? null;
    const effectiveSendInMinutes =
      parsedSendInMinutes ?? campaignDoc.sendConfig?.sendInMinutes ?? null;
    const effectiveSendInHours =
      parsedSendInHours ?? campaignDoc.sendConfig?.sendInHours ?? null;

    if (effectiveTotalSend) runtimeConfig.totalSend = effectiveTotalSend;
    if (effectiveSendInSeconds) runtimeConfig.sendInSeconds = effectiveSendInSeconds;
    if (effectiveSendInMinutes) runtimeConfig.sendInMinutes = effectiveSendInMinutes;
    if (effectiveSendInHours) runtimeConfig.sendInHours = effectiveSendInHours;

    // At least one throttle unit should be present if totalSend is present.
    if (
      runtimeConfig.totalSend &&
      !runtimeConfig.sendInSeconds &&
      !runtimeConfig.sendInMinutes &&
      !runtimeConfig.sendInHours
    ) {
      return res.status(400).json({ error: "resume_throttle_required" });
    }

    // Persist updated values so next resume uses latest values automatically.
    campaignDoc.sendConfig = campaignDoc.sendConfig || {};
    if (parsedTotalSend) campaignDoc.sendConfig.totalSend = parsedTotalSend;
    if (parsedSendInSeconds) campaignDoc.sendConfig.sendInSeconds = parsedSendInSeconds;
    if (parsedSendInMinutes) campaignDoc.sendConfig.sendInMinutes = parsedSendInMinutes;
    if (parsedSendInHours) campaignDoc.sendConfig.sendInHours = parsedSendInHours;

    campaignDoc.status = "RUNNING";
    campaignDoc.execution = campaignDoc.execution || {};
    campaignDoc.execution.lastStatusUpdate = new Date();
    await campaignDoc.save();

    res.json({
      status: "resumed",
      runtimeConfig,
    });
  } catch (err) {
    res.status(500).json({ error: "resume_failed" });
  }
});

router.post("/:campaign/stop", loadCampaign, async (req, res) => {
  try {
    const campaignDoc = req.campaignDoc;

    if (!validateTransition(campaignDoc.status, "STOPPED")) {
      return res.status(400).json({ error: "invalid_transition" });
    }

    campaignDoc.status = "STOPPED";
    campaignDoc.execution = campaignDoc.execution || {};
    campaignDoc.execution.completedAt = new Date();
    campaignDoc.execution.lastStatusUpdate = new Date();
    await campaignDoc.save();

    res.json({ status: "stopped" });
  } catch (err) {
    res.status(500).json({ error: "stop_failed" });
  }
});

export default router;