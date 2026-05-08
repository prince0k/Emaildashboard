/**
 * createCampaign.js
 * FINAL PRODUCTION VERSION (TRANSACTION SAFE + DUPLICATE SAFE)
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
    const {
      sender,
      campaignName,
      creativeId,
      offerId,
      isp,
      segmentName,
      routes,
      runtimeOfferId,
      trackingMode,
      trackingDomain,
      scheduledDate,
    } = req.body;

  /* ================= PERMISSION CHECK ================= */

    if (!req.user.permissions?.includes("campaign.create")) {
      return res.status(403).json({ error: "forbidden" });
    }

    const senderDoc = await SenderServer.findOne({
      _id: sender,
      active: true,
    }).lean();

    if (!senderDoc) {
      return res.status(400).json({
        error: "invalid_or_inactive_sender",
      });
    }

    const senderCode = senderDoc.code || "SRV";
    /* ================= VALIDATION ================= */

    if (!sender || !creativeId || !offerId || !segmentName) {
      return res.status(400).json({ error: "missing_required_fields" });
    }

     if (routes !== undefined) {
      if (!Array.isArray(routes)) {
        return res.status(400).json({ error: "invalid_route_structure" });
      }

      for (const r of routes) {
        if (!r || !r.from_user || !r.domain || !r.vmta) {
          return res.status(400).json({ error: "invalid_route_structure" });
        }
      }
    }

    let cleanCampaignName = campaignName
      ? String(campaignName).trim()
      : "";
    /* ================= SCHEDULING ================= */

    let scheduledAt = null;

    if (scheduledDate) {
      const selected = new Date(scheduledDate + "T00:00:00");
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selected < today) {
        return res.status(400).json({
          error: "scheduled_date_cannot_be_in_past",
        });
      }

      scheduledAt = selected;
    }

    
    /* ================= FETCH OFFER ================= */

    const offer = await Offer.findById(offerId).lean();
    console.log("DEBUG OFFER ID:", offerId);

    if (!offer || !offer.isActive || offer.isDeleted) {
      return res.status(404).json({ error: "offer_not_active" });
    }



    if (!cleanCampaignName) {
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

    if (!offer.sid || !offer.offer || !offer.md5FileName) {
      return res.status(400).json({
        error: "offer_incomplete_configuration",
      });
    }

    

    
    if (scheduledAt) {
  const yyyy = scheduledAt.getFullYear();
  const mm = String(scheduledAt.getMonth() + 1).padStart(2, "0");
  const dd = String(scheduledAt.getDate()).padStart(2, "0");

  const dateStr = `${yyyy}${mm}${dd}`;
  const shortUserId = req.user.userId;

  cleanCampaignName = sanitize(
    [
      isp,
      offer.offer,
      offer.cid,
      offer.sid,
      dateStr,
      `by_${shortUserId}`,
      `srv_${senderCode}`
    ]
      .filter(Boolean)
      .join("_")
  );
}

    /* ================= DUPLICATE CAMPAIGN CHECK ================= */

    const baseCampaignName = cleanCampaignName;

    const existing = await Campaign.find({
      campaignName: new RegExp(`^${baseCampaignName}`)
    }).select("campaignName");

    let version = 1;

    if (existing.length > 0) {
      const numbers = existing
        .map(c => {
          const match = c.campaignName.match(/_v(\d+)$/);
          return match ? parseInt(match[1]) : 1;
        });

      version = Math.max(...numbers) + 1;
    }

    cleanCampaignName = `${baseCampaignName}_v${version}`;

    /* ================= FETCH CREATIVE ================= */

    const creative = await Creative.findById(creativeId).lean();

    if (!creative) {
      return res.status(404).json({ error: "creative_not_found" });
    }

    const creativeHtml =
      creative.html ||
      creative.htmlContent ||
      creative.body ||
      "";

    if (!creativeHtml.trim()) {
      return res.status(400).json({
        error: "creative_html_required",
      });
    }


    /* ================= BUILD RUNTIME OFFER ID ================= */

    const finalOfferId = buildRuntimeOfferId({
      server: senderCode,
      sid: offer.sid,
      cid: offer.cid,
      user: req.user.userId,
      override: runtimeOfferId
    });

    if (!finalOfferId || finalOfferId.length < 5) {
      return res.status(400).json({
        error: "runtime_offer_id_invalid",
      });
    }

    /* ================= RUNTIME OFFER ID CONFLICT CHECK ================= */

    const baseOfferId = finalOfferId;

    const existingDeploys = await Deploy.find({
      offer_id: new RegExp(`^${baseOfferId}`)
    }).select("offer_id");

    let offerVersion = 1;

    if (existingDeploys.length > 0) {
      const numbers = existingDeploys.map(d => {
        const match = d.offer_id.match(/_(\d+)$/);
        return match ? parseInt(match[1]) : 1;
      });

      offerVersion = Math.max(...numbers) + 1;
    }

    const versionedOfferId = `${baseOfferId}_${offerVersion}`;

    /* ================= TRACKING ================= */

    const allowedTrackingModes = ["from", "domain"];
    const requestedTrackingMode = String(trackingMode || "from").toLowerCase();

    const finalTrackingMode = allowedTrackingModes.includes(requestedTrackingMode)
      ? requestedTrackingMode
      : "from";

    let finalTrackingDomain = null;

    if (finalTrackingMode === "domain") {
      const domainToUse =
        (trackingDomain && trackingDomain.trim()) ||
        DEFAULT_TRACKING_DOMAIN;

      if (!domainToUse) {
        return res.status(400).json({
          error: "tracking_domain_required_for_domain_mode",
        });
      }

      finalTrackingDomain = domainToUse.trim();
    }

    

/* ================= CREATE CAMPAIGN FILES ON SENDER ================= */

    const senderPayload = {
      campaignName: cleanCampaignName,
      creativeName: creative._id.toString(),
      offerId: versionedOfferId,
      creativeHtml,
      dba: senderDoc?.dba?.trim() || "",
      createOnly: true
    };

    console.log("🚀 Calling Sender...");
    console.log("➡️ Sender ID:", sender);
    console.log("➡️ Endpoint:", "createCampaignFiles.php");
    console.log("➡️ Payload:", JSON.stringify(senderPayload, null, 2));
    

    let senderResponse;
    const senderStart = Date.now();

    try {
      senderResponse = await callSender(
        sender,
        "createCampaignFiles.php",
        senderPayload
      );

      console.log("✅ Sender Raw Response:", senderResponse);
      console.log(`⏱ Sender execution time: ${Date.now() - senderStart} ms`);
    } catch (senderErr) {
      console.error("🔥 Sender Call Exception FULL:", senderErr);
console.error("🔥 Code:", senderErr.code);
console.error("🔥 Message:", senderErr.message);
console.error("🔥 Stack:", senderErr.stack);

      return res.status(502).json({
        error: "sender_call_exception",
        message: senderErr.message,
      });
    }

    if (
      !senderResponse ||
      senderResponse.error ||
      senderResponse.success === false
    ) {
      console.error("❌ Sender create failed:");
      console.error("Response:", senderResponse);

      return res.status(502).json({
        error: "sender_create_failed",
        details: senderResponse,
      });
    }

/* ================= TRANSACTION ================= */

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

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
      { upsert: true, session }
    );

    await Campaign.create(
      [{
        campaignName: cleanCampaignName,
        sender,
        routes: Array.isArray(routes) ? routes : [],
        creativeId,
        offerId,
        runtimeOfferId: versionedOfferId,
        isp,
        segmentName,
        scheduledAt,
        trackingMode: finalTrackingMode,
        trackingDomain: finalTrackingDomain,
        status: "CREATED",
        createdAt: new Date(),
        createdBy: req.user._id,
        
      }],
      { session }
    );

    await session.commitTransaction();

  } catch (err) {
    await session.abortTransaction();

    console.error("❌ DB TRANSACTION FAILED:", err);

    if (err.code === 11000) {
      return res.status(400).json({
        error: "campaign_already_exists",
      });
    }

    return res.status(500).json({
      error: "campaign_creation_failed",
      message: err.message,
    });

  } finally {
    session.endSession();
  }

  return res.json({
    status: "created",
    campaign: cleanCampaignName,
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