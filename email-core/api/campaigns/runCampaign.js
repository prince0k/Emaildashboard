/**
 * runCampaign.js
 * FINAL MERGED PRODUCTION VERSION
 */

import Campaign from "../../models/Campaign.js";
import { buildRoutes } from "./helpers/buildRoutes.js";
import { callSender } from "./helpers/senderBridge.js";
import SubjectLine from "../../models/SubjectLine.js";
import FromLine from "../../models/FromLine.js";
import SenderServer from "../../models/SenderServer.js";
import SuppressionJob from "../../models/SuppressionJob.js";


export default async function runCampaign(req, res) {
  try {
    let { campaign } = req.params;

    /* ================= PERMISSION GUARD ================= */

    if (!req.user.permissions?.includes("campaign.send")) {
  return res.status(403).json({ error: "forbidden" });
}

    if (!campaign || typeof campaign !== "string") {
      return res.status(400).json({ error: "invalid_campaign_name" });
    }

    campaign = decodeURIComponent(campaign).trim();

    const {
      mode,
      seeds,
      testRoutes,
      testSeeds,
      testTotalSend,
      totalSend,
      aliases, 
      sendInSeconds,
      sendInMinutes,
      sendInHours,
      trackingMode,
      trackingDomain,
      creativeHtmlOverride,
      seedAfter,
      seedMode,
      contentMode,
      textEncoding,
      htmlEncoding,
      subject,
      fromName,

      // ENVELOPE
      envelopeMode,
      envelopeCustomType,
      envelopeCustomEmail,
      envelopeCustomDomain,
      envelopePatternBlocks,
      envelopePatternLength,

      // HEADER
      headerMode,
      headerCustomType,
      headerCustomEmail,
      headerCustomDomain,
      headerPatternBlocks,
      headerPatternLength,

      // HEADER BLOCK
      headerBlockMode,
      customHeaderBlock,
      routes: selectedRoutes,

    } = req.body;

    /* ================= BASIC VALIDATION ================= */

    if (!mode) {
      return res.status(400).json({ error: "missing_required_fields" });
    }

    if (!["TEST", "LIVE"].includes(mode)) {
      return res.status(400).json({ error: "invalid_mode" });
    }

    if (aliases && !Array.isArray(aliases)) {
      return res.status(400).json({ error: "aliases_must_be_array" });
    }

    /* ================= FETCH CAMPAIGN ================= */
    const { FILE_BASE_URL } = process.env;

    if (!FILE_BASE_URL) {
      throw new Error("FILE_BASE_URL env variable is required");
    }
    const campaignDoc = await Campaign.findOne({
  campaignName: campaign,
}); // better

if (!campaignDoc) {
  return res.status(404).json({ error: "campaign_not_found" });
}

if (!campaignDoc.sender) {
  return res.status(400).json({ error: "campaign_sender_missing" });
}
    const senderDoc = await SenderServer.findOne({
  _id: campaignDoc.sender,
  active: true,
}).lean();

if (!senderDoc) {
  return res.status(400).json({
    error: "campaign_sender_inactive",
  });
}

    /* ================= LIFECYCLE PROTECTION ================= */

    // Completely dead campaigns
    if (["STOPPED", "FAILED"].includes(campaignDoc.status)) {
      return res.status(400).json({ error: "campaign_not_runnable" });
    }

    // 🔒 LIVE can only happen once
    if (mode === "LIVE" && !req.body.isResume) {
  if (campaignDoc.liveExecuted) {
    return res.status(400).json({
      error: "live_already_executed",
    });
  }
}

   const requestedRoutes = Array.isArray(selectedRoutes)
      ? selectedRoutes
      : [];
    const campaignRoutes = Array.isArray(campaignDoc.routes)
      ? campaignDoc.routes
      : [];
    const effectiveRoutes =
      requestedRoutes.length > 0 ? requestedRoutes : campaignRoutes;

    if (!Array.isArray(effectiveRoutes) || effectiveRoutes.length === 0) {
      return res.status(400).json({ error: "campaign_routes_missing" });
    }

    let normalizedRoutes;
    try {
      normalizedRoutes = buildRoutes(effectiveRoutes);
    } catch {
      return res.status(400).json({ error: "invalid_route_structure" });
    }

    // 🔒 LIVE protection
if (mode === "LIVE") {
  const s = campaignDoc.suppression;

  if (
    !s ||
    s.status !== "COMPLETED" ||     // 🔥 must be completed
    !s.outputFile ||                // 🔥 file required
    typeof s.finalCount !== "number" ||
    s.finalCount <= 0               // 🔥 must have usable data
  ) {
    return res.status(400).json({
      error: "run_suppression_first",
    });
  }
}
    /* ================= FETCH SUBJECT & FROM ================= */

    const subjectDoc = await SubjectLine.findOne({
      offerId: campaignDoc.offerId,
    }).sort({ createdAt: -1 });

    const fromDoc = await FromLine.findOne({
      offerId: campaignDoc.offerId,
    }).sort({ createdAt: -1 });

    if (!subjectDoc) {
      return res.status(400).json({ error: "subject_line_not_found_for_offer" });
    }

    if (!fromDoc) {
      return res.status(400).json({ error: "from_line_not_found_for_offer" });
    }

    /* ================= TRACKING ================= */

    const requestedTrackingMode =
      String(trackingMode || campaignDoc.trackingMode || "from").toLowerCase();

    if (!["from", "domain"].includes(requestedTrackingMode)) {
      return res.status(400).json({ error: "invalid_tracking_mode" });
    }

    const finalTrackingMode = requestedTrackingMode;

    const finalTrackingDomain =
      finalTrackingMode === "domain"
        ? trackingDomain || campaignDoc.trackingDomain
        : null;

    if (finalTrackingMode === "domain" && !finalTrackingDomain) {
      return res.status(400).json({ error: "tracking_domain_required" });
    }

    /* ================= SUBJECT & FROM ================= */

    const finalSubject =
      typeof subject === "string" && subject.trim() !== ""
        ? subject.trim()
        : subjectDoc.text;

    const finalFromName =
      typeof fromName === "string" && fromName.trim() !== ""
        ? fromName.trim()
        : fromDoc.text;

    /* ================= MODE VALIDATION ================= */

    let parsedTotalSend = 0;
    let parsedSendSeconds = null;
    let parsedSendMinutes = null;
    let parsedSendHours = null;
    let parsedSeedAfter = 0;
    let parsedSeedMode = "round";

    if (mode === "TEST") {
      if (!Array.isArray(seeds) || seeds.length === 0) {
        return res.status(400).json({ error: "seeds_required_for_test" });
      }
    }

    if (mode === "LIVE") {
      parsedTotalSend = parseInt(totalSend, 10);
      parsedSendSeconds = parseInt(sendInSeconds, 10);
      parsedSendMinutes = parseInt(sendInMinutes, 10);
      parsedSendHours = parseInt(sendInHours, 10);

      if (isNaN(parsedTotalSend) || parsedTotalSend <= 0) {
        return res.status(400).json({ error: "invalid_total_send" });
      }

      if (
        (isNaN(parsedSendSeconds) || parsedSendSeconds <= 0) &&
        (isNaN(parsedSendMinutes) || parsedSendMinutes <= 0) &&
        (isNaN(parsedSendHours) || parsedSendHours <= 0)
      ) {
        return res.status(400).json({ error: "invalid_send_time" });
      }

      if (seedAfter !== undefined && seedAfter !== null) {
        parsedSeedAfter = parseInt(seedAfter, 10);

        if (isNaN(parsedSeedAfter) || parsedSeedAfter <= 0) {
          return res.status(400).json({ error: "invalid_seed_after" });
        }

        if (!Array.isArray(seeds) || seeds.length === 0) {
          return res.status(400).json({
            error: "seeds_required_for_seed_after",
          });
        }

        parsedSeedMode = seedMode === "random" ? "random" : "round";
      }
    }

    /* ================= CREATIVE OVERRIDE ================= */

    let creativeWasOverridden = false;

    // 🔥 force override even on resume
    const html =
      typeof creativeHtmlOverride === "string" && creativeHtmlOverride.trim() !== ""
        ? creativeHtmlOverride.trim()
        : null;

    if (!html) {
      console.warn("⚠️ No creative override provided");
    } else {
      const updateRes = await callSender(
        campaignDoc.sender,
        "updateCreative.php",
        {
          campaignName: campaignDoc.campaignName,
          html,
        }
      );

      if (!updateRes || updateRes.error) {
        return res.status(502).json({
          error: "creative_update_failed",
          details: updateRes,
        });
      }

      creativeWasOverridden = true;
    } // ✅🔥 YE MISSING THA

    /* ================= HEADER OVERRIDE (SL / FL) ================= */

    let headersWereOverridden = false;

    if (subject || fromName) {

      const headerUpdateRes = await callSender(
        campaignDoc.sender,
        "updateHeaders.php",
        {
          campaignName: campaignDoc.campaignName,
          subject: finalSubject,
          fromName: finalFromName
        }
      );

      if (!headerUpdateRes || headerUpdateRes.error) {
        return res.status(502).json({
          error: "header_update_failed",
          details: headerUpdateRes,
        });
      }

      headersWereOverridden = true;
    }

    /* ================= BUILD PAYLOAD ================= */

    const payload = {
      campaignName: campaignDoc.campaignName,
      mode,
      routes: normalizedRoutes,
      testRoutes,
      testSeeds,
      testTotalSend,
      aliases: Array.isArray(aliases) ? aliases : [],
      trackingMode: finalTrackingMode,
      trackingDomain: finalTrackingDomain,
      offerId: campaignDoc.runtimeOfferId,

      contentMode: contentMode || "multipart",
      textEncoding: textEncoding || "base64",
      htmlEncoding: htmlEncoding || "base64",

      subject: finalSubject,
      fromName: finalFromName,

      envelopeMode: envelopeMode || "route",
      envelopeCustomType,
      envelopeCustomEmail,
      envelopeCustomDomain,
      envelopePatternBlocks,
      envelopePatternLength,

      headerMode: headerMode || "route",
      headerCustomType,
      headerCustomEmail,
      headerCustomDomain,
      headerPatternBlocks,
      headerPatternLength,

      headerBlockMode: headerBlockMode || "default",
      customHeaderBlock,
    };

    if (mode === "TEST") {
  payload.seeds = seeds;
  payload.totalSend = seeds.length;   // 🔥 CRITICAL FIX
}

if (mode === "LIVE") {
  payload.totalSend = parsedTotalSend;

  if (parsedSendSeconds > 0)
    payload.sendInSeconds = parsedSendSeconds;

  if (parsedSendMinutes > 0)
    payload.sendInMinutes = parsedSendMinutes;

  if (parsedSendHours > 0)
    payload.sendInHours = parsedSendHours;

  if (parsedSeedAfter > 0) {
    payload.seeds = seeds;
    payload.seedAfter = parsedSeedAfter;
    payload.seedMode = parsedSeedMode;
  }

  // 🔥 ADD HERE ONLY
  if (!req.body.isResume) {
    payload.finalDataFileUrl =
      `${FILE_BASE_URL}/${campaignDoc.suppression.outputFile}`;
  }
}

if (req.body.isResume) {
  payload.isResume = true;
}
// console.log("FINAL PAYLOAD TO SENDER:", JSON.stringify(payload, null, 2));
    const senderResponse = await callSender(
      campaignDoc.sender,
      "runCampaign.php",
      payload
    );

    if (!senderResponse || senderResponse.error) {
  return res.status(502).json({
    error: "sender_failed",
    details: senderResponse,
  });
}

// Accept multiple success formats from sender
const isSuccess =
  senderResponse.status === "started" ||
  senderResponse.status === "ok" ||
  senderResponse.success === true;

if (!isSuccess) {
  return res.status(502).json({
    error: "sender_invalid_response",
    details: senderResponse,
  });
}

    /* ================= SAVE SEND CONFIG SNAPSHOT ================= */
// console.log("REQ.USER OBJECT:", req.user);
campaignDoc.sendConfig = {
  mode,

  subject: finalSubject,
  fromName: finalFromName,

  trackingMode: finalTrackingMode,
  trackingDomain: finalTrackingDomain,

  aliases: Array.isArray(aliases) ? aliases : [],
  seeds: Array.isArray(seeds) ? seeds : [],

  totalSend:
    mode === "TEST"
      ? (Array.isArray(seeds) ? seeds.length : 0)
      : Number(parsedTotalSend) || 0,

  sendInSeconds: parsedSendSeconds > 0 ? parsedSendSeconds : undefined,
  sendInMinutes: parsedSendMinutes > 0 ? parsedSendMinutes : undefined,
  sendInHours: parsedSendHours > 0 ? parsedSendHours : undefined,

  seedAfter: parsedSeedAfter > 0 ? parsedSeedAfter : 0,
  seedMode: parsedSeedMode,

  contentMode: payload.contentMode,
  textEncoding: payload.textEncoding,
  htmlEncoding: payload.htmlEncoding,

  envelopeMode: payload.envelopeMode,
  headerMode: payload.headerMode,

  createdBy: req.user.mongoId
};


    /* ================= STATUS UPDATE ================= */

    campaignDoc.execution = campaignDoc.execution || {};

    if (mode === "LIVE") {
      campaignDoc.status = "RUNNING";
      campaignDoc.execution = {
      ...campaignDoc.execution,
      startedAt: new Date(),

      totalSend: parsedTotalSend,

      sendDurationSeconds:
        parsedSendSeconds ||
        (parsedSendMinutes ? parsedSendMinutes * 60 : null) ||
        (parsedSendHours ? parsedSendHours * 3600 : null),

      mode
    };

      // 🔒 Mark LIVE as permanently executed
      campaignDoc.liveExecuted = true;
    }


    if (mode === "TEST") {
      campaignDoc.testedAt = new Date();

      // 🔥 only set TESTED if LIVE kabhi run nahi hua
      if (!campaignDoc.liveExecuted) {
        campaignDoc.status = "TESTED";
      }
    }

    /* ================= UPDATE SUPPRESSION HISTORY ================= */

    if (mode === "LIVE" && campaignDoc.suppression?.jobId) {

      await SuppressionJob.findByIdAndUpdate(
        campaignDoc.suppression.jobId,
        {
          $set: {
            status: "USED",
            usedByCampaign: campaignDoc._id,
            usedAt: new Date()
          }
        }
      );

    }

    campaignDoc.routes = normalizedRoutes;
    await campaignDoc.save();
    console.log("DEBUG SENDCONFIG:", campaignDoc.sendConfig);
    return res.json({
      status: "started",
      campaign: campaignDoc.campaignName,
      mode,
      creativeOverridden: creativeWasOverridden,
      headersOverridden: headersWereOverridden,
      sender: senderResponse,
    });

  } catch (err) {
    console.error("RUN CAMPAIGN ERROR:", err);

    return res.status(500).json({
      error: "campaign_start_failed",
      message: err.message,
    });
  }
}
