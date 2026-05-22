/**
 * createCampaign.js
 * FINAL PRODUCTION VERSION (SUPPORT UPDATES + DRAFTS)
 */

import Offer from "../../models/Offer.js";
import Creative from "../../models/Creative.js";
import Campaign from "../../models/Campaign.js";
import Deploy from "../../models/Deploy.js";
import { buildRuntimeOfferId } from "./helpers/buildRuntimeOfferId.js";
import { callSender } from "./helpers/senderBridge.js";
import SenderServer from "../../models/SenderServer.js";
import mongoose from "mongoose";
import os from "os";
import fs from "fs";

function sanitize(str = "") {
  return String(str)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "_")   // only a-z0-9 allowed
    .replace(/_+/g, "_")          // collapse ___
    .replace(/^_|_$/g, "");       // trim _
}
const { DEFAULT_TRACKING_DOMAIN } = process.env;

if (!DEFAULT_TRACKING_DOMAIN) {
  throw new Error("DEFAULT_TRACKING_DOMAIN env variable is required");
}

export default async function createCampaign(req, res) {
  try {
    let { campaignId } = req.body;
    const {
      sender,
      campaignName,
      creativeId,
      offerId,
      isp,
      segmentName,
      routes,
      routeIds,
      subjectIds,
      fromIds,
      runtimeOfferId,
      trackingMode,
      trackingDomain,
      scheduledDate,
      openTriggerCampaignId,
      htmlOverride,
      headerMode,
      customHeaderBlock,
      textEncoding,
      htmlEncoding,
      suppressionConfig,
      // ===== EXTRA SEND SPEED & THROTTLE FIELDS =====
      totalSend,
      sendInSeconds,
      sendInMinutes,
      sendInHours,
      seeds,
      seedAfter,
      seedMode,
    } = req.body;

  /* ================= PERMISSION CHECK ================= */

    if (!req.user.permissions?.includes("campaign.create")) {
      return res.status(403).json({ error: "forbidden" });
    }

    const isDraft = req.body.draft === true || req.body.draft === "true" || req.body.isDraft === true || req.body.isDraft === "true";

    /* ================= VALIDATION ================= */

    if (!isDraft && (!sender || !offerId || !creativeId || !segmentName)) {
      return res.status(400).json({ error: "validation_failed_required_fields_missing" });
    }

    const senderDoc = sender ? await SenderServer.findOne({
      _id: sender,
      active: true,
    }).lean() : null;

    if (!isDraft && !senderDoc) {
      return res.status(400).json({
        error: "invalid_or_inactive_sender",
      });
    }

    const senderCode = senderDoc?.code || "SRV";

    const offer = offerId ? await Offer.findById(offerId).lean() : null;
    if (!isDraft && (!offer || !offer.isActive || offer.isDeleted)) {
      return res.status(404).json({ error: "offer_not_active" });
    }

    // Resolve routeIds if provided
    let resolvedRoutes = routes || [];
    if (routeIds && Array.isArray(routeIds) && senderDoc) {
      resolvedRoutes = senderDoc.routes
        .filter(r => routeIds.includes(String(r._id)))
        .map(r => ({
          from_user: r.from_user,
          domain: r.domain,
          vmta: r.vmta
        }));
    }

    let cleanCampaignName = campaignName ? String(campaignName).trim() : "";

    /* ================= DUP CHECK / IDEMPOTENCY LOCK ================= */
    if (!campaignId && cleanCampaignName) {
      const existingCampaign = await Campaign.findOne({ campaignName: cleanCampaignName });
      if (existingCampaign) {
        if (existingCampaign.status === "DRAFT" || existingCampaign.status === "CREATED") {
          campaignId = existingCampaign._id.toString();
        } else {
          return res.status(400).json({
            error: "campaign_name_already_exists",
            message: "A campaign with this name already exists and is active/completed."
          });
        }
      }
    }

    /* ================= SCHEDULING ================= */
    let scheduledAt = null;
    if (scheduledDate) {
      const selected = new Date(scheduledDate + "T00:00:00");
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selected < today && !isDraft) {
        return res.status(400).json({ error: "scheduled_date_cannot_be_in_past" });
      }
      scheduledAt = selected;
    }

    /* ================= RESOLVE CAMPAIGN NAME ================= */
    let versionedCampaignName = cleanCampaignName;

    if (!campaignId) {
        // NEW CAMPAIGN
        if (!cleanCampaignName && offer) {
            cleanCampaignName = sanitize(
              [
                isp,
                offer.offer,
                offer.cid,
                offer.sid,
                Date.now(),
                `by_${req.user.userId}`,
                `srv_${senderCode}`
              ]
                .filter(Boolean)
                .join("_")
            );
          }
      
          if (scheduledAt && offer) {
            const yyyy = scheduledAt.getFullYear();
            const mm = String(scheduledAt.getMonth() + 1).padStart(2, "0");
            const dd = String(scheduledAt.getDate()).padStart(2, "0");
            const dateStr = `${yyyy}${mm}${dd}`;
            cleanCampaignName = sanitize(
              [
                isp,
                offer.offer,
                offer.cid,
                offer.sid,
                dateStr,
                `by_${req.user.userId}`,
                `srv_${senderCode}`
              ]
                .filter(Boolean)
                .join("_")
            );
          }
      
          const baseCampaignName = cleanCampaignName || "Draft_" + Date.now();
          const existing = await Campaign.find({
            campaignName: new RegExp(`^${baseCampaignName}`)
          }).select("campaignName");
    
          let version = 1;
          if (existing.length > 0) {
            const numbers = existing.map(c => {
              const match = c.campaignName.match(/_v(\d+)$/);
              return match ? parseInt(match[1]) : 1;
            });
            version = Math.max(...numbers) + 1;
          }
          versionedCampaignName = existing.length > 0 ? `${baseCampaignName}_v${version}` : baseCampaignName;
    } else {
        // UPDATE EXISTING - Use current name if not provided
        const existingDoc = await Campaign.findById(campaignId);
        if (existingDoc && !cleanCampaignName) {
            versionedCampaignName = existingDoc.campaignName;
        }
    }

    /* ================= BUILD RUNTIME OFFER ID ================= */

    let finalOfferId = runtimeOfferId;
    if (offer && !finalOfferId) {
      try {
        finalOfferId = buildRuntimeOfferId({
          server: senderCode,
          sid: offer.sid,
          cid: offer.cid,
          campaignName: versionedCampaignName,
          override: runtimeOfferId
        });
      } catch (e) {
        if (!isDraft) throw e;
      }
    }

    const versionedOfferId = finalOfferId || "draft_" + Date.now();

    /* ================= TRACKING ================= */

    const allowedTrackingModes = ["from", "domain"];
    const requestedTrackingMode = String(trackingMode || "from").toLowerCase();
    const finalTrackingMode = allowedTrackingModes.includes(requestedTrackingMode) ? requestedTrackingMode : "from";
    let finalTrackingDomain = null;

    if (finalTrackingMode === "domain") {
      finalTrackingDomain = (trackingDomain && trackingDomain.trim()) || DEFAULT_TRACKING_DOMAIN;
      if (!isDraft && !finalTrackingDomain) {
        return res.status(400).json({ error: "tracking_domain_required_for_domain_mode" });
      }
    }

    /* ================= PERSIST TO DB ================= */

    const updatePayload = {
        campaignName: versionedCampaignName,
        sender: sender || null,
        creativeId: creativeId || null,
        offerId: offerId || null,
        runtimeOfferId: versionedOfferId,
        isp,
        segmentName,
        scheduledAt,
        trackingMode: finalTrackingMode,
        trackingDomain: finalTrackingDomain,
        status: isDraft ? "DRAFT" : "CREATED",
        openTriggerCampaignId: openTriggerCampaignId || null,
        htmlOverride: htmlOverride || null,
        routes: resolvedRoutes,
        sendConfig: {
          subjectIds: Array.isArray(subjectIds) ? subjectIds : [],
          fromIds: Array.isArray(fromIds) ? fromIds : [],
          headerBlockMode: headerMode || "default",
          customHeaderBlock: customHeaderBlock || "",
          textEncoding: textEncoding || "base64",
          htmlEncoding: htmlEncoding || "base64",
          createdBy: req.user.mongoId,
          mode: "LIVE",
          totalSend: typeof totalSend !== "undefined" && totalSend !== null ? Number(totalSend) : undefined,
          sendInSeconds: typeof sendInSeconds !== "undefined" && sendInSeconds !== null ? Number(sendInSeconds) : undefined,
          sendInMinutes: typeof sendInMinutes !== "undefined" && sendInMinutes !== null ? Number(sendInMinutes) : undefined,
          sendInHours: typeof sendInHours !== "undefined" && sendInHours !== null ? Number(sendInHours) : undefined,
          seeds: Array.isArray(seeds) ? seeds : (typeof seeds === "string" ? seeds.split(",").map(x => x.trim()).filter(Boolean) : []),
          seedAfter: typeof seedAfter !== "undefined" && seedAfter !== null ? Number(seedAfter) : 0,
          seedMode: ["round", "random"].includes(seedMode) ? seedMode : "round",
        }
    };

    // Persist suppression config from Step 3
    if (suppressionConfig && typeof suppressionConfig === "object") {
      updatePayload.suppressionConfig = {
        queueDomain: suppressionConfig.queueDomain || null,
        skipUnsub: suppressionConfig.skipUnsub === true,
        inclusionSegments: Array.isArray(suppressionConfig.inclusionSegments)
          ? suppressionConfig.inclusionSegments
          : [],
        exclusionSegments: Array.isArray(suppressionConfig.exclusionSegments)
          ? suppressionConfig.exclusionSegments
          : [],
      };
    }

    if (!isDraft && offer) {
        await Deploy.updateOne(
          { offer_id: versionedOfferId, cid: offer.cid },
          {
            $set: {
              sid: offer.sid.toLowerCase(),
              sponsor: offer.sponsor,
              offer: offer.offer,
              redirectLinks: offer.redirectLinks || [],
              optoutLink: offer.optoutLink,
              md5FileName: offer.md5FileName,
              status: "DEPLOYED",
              deployedAt: new Date(),
            },
          },
          { upsert: true }
        );
    }

    const action = campaignId ? "update" : "create";
    let resultCampaign;
    if (campaignId) {
        resultCampaign = await Campaign.findByIdAndUpdate(
            campaignId,
            { $set: updatePayload },
            { new: true }
        );
    } else {
        updatePayload.createdAt = new Date();
        updatePayload.createdBy = req.user.mongoId;
        resultCampaign = await Campaign.create(updatePayload);
    }

    console.log("[CAMPAIGN OBSERVABILITY] Action: %s, CampaignId: %s, UserId: %s, WizardStep: %s, RequestSource: %s", action, resultCampaign._id, req.user.userId || req.user.mongoId, req.body.step || "unknown", req.body.requestSource || "save/suppression");

    return res.json({
        status: isDraft ? "draft_saved" : "created",
        campaign: resultCampaign.campaignName,
        campaignId: resultCampaign._id,
        offerId: versionedOfferId,
    });

  } catch (err) {
    console.error("CREATE + DEPLOY ERROR:", err);
    return res.status(500).json({
      error: "campaign_creation_failed",
      message: err.message,
    });
  }
}