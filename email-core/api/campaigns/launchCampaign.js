import Offer from "../../models/Offer.js";
import Campaign from "../../models/Campaign.js";
import Deploy from "../../models/Deploy.js";
import SenderServer from "../../models/SenderServer.js";
import SubjectLine from "../../models/SubjectLine.js";
import FromLine from "../../models/FromLine.js";
import { buildRuntimeOfferId } from "./helpers/buildRuntimeOfferId.js";
import { buildRoutes } from "./helpers/buildRoutes.js";
import { campaignQueue } from "../../queue/campaignQueue.js";

function sanitize(str = "") {
  return String(str)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}

export default async function launchCampaign(req, res) {
  console.log("🔥 HIT LAUNCH CAMPAIGN ROUTE");
  try {
    const { DEFAULT_TRACKING_DOMAIN } = process.env;
    if (!DEFAULT_TRACKING_DOMAIN) {
      throw new Error("DEFAULT_TRACKING_DOMAIN env variable is required");
    }

    if (!req.user.permissions?.includes("campaign.create") || !req.user.permissions?.includes("campaign.send")) {
      return res.status(403).json({ error: "forbidden" });
    }

    let { campaignId } = req.body;
    const {
      sender,
      campaignName,
      creativeId,
      offerId,
      isp,
      segmentName,
      routeIds,
      subjectIds,
      fromIds,
      runtimeOfferId,
      trackingMode,
      trackingDomain,
      scheduledDate,
      htmlOverride,
      headerMode,
      customHeaderBlock,
      textEncoding,
      htmlEncoding,
      suppressionConfig,
      totalSend,
      sendInSeconds,
      sendInMinutes,
      sendInHours,
      seeds,
      seedAfter,
      seedMode,
    } = req.body;

    // VALIDATION
    if (!sender || !offerId || !creativeId || !segmentName) {
      return res.status(400).json({ error: "validation_failed_required_fields_missing" });
    }

    const senderDoc = await SenderServer.findOne({ _id: sender, active: true }).lean();
    if (!senderDoc) {
      return res.status(400).json({ error: "invalid_or_inactive_sender" });
    }
    const senderCode = senderDoc.code || "SRV";

    const offer = await Offer.findById(offerId).lean();
    if (!offer || !offer.isActive || offer.isDeleted) {
      return res.status(404).json({ error: "offer_not_active" });
    }

    let resolvedRoutes = [];
    if (routeIds && Array.isArray(routeIds) && senderDoc) {
      resolvedRoutes = senderDoc.routes
        .filter(r => routeIds.includes(String(r._id)))
        .map(r => ({
          from_user: r.from_user,
          domain: r.domain,
          vmta: r.vmta
        }));
    }
    if (resolvedRoutes.length === 0) {
      return res.status(400).json({ error: "campaign_routes_missing" });
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

    let scheduledAt = null;

    if (scheduledDate) {
      const selected = new Date(scheduledDate + "T00:00:00");
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selected < today) {
        return res.status(400).json({ error: "scheduled_date_cannot_be_in_past" });
      }
      scheduledAt = selected;
    }

    // RESOLVE CAMPAIGN NAME
    let versionedCampaignName = cleanCampaignName;
    if (!campaignId) {
      if (!cleanCampaignName && offer) {
        cleanCampaignName = sanitize(
          [isp, offer.offer, offer.cid, offer.sid, scheduledAt ? `${scheduledAt.getFullYear()}${String(scheduledAt.getMonth() + 1).padStart(2, "0")}${String(scheduledAt.getDate()).padStart(2, "0")}` : Date.now(), `by_${req.user.userId}`, `srv_${senderCode}`].filter(Boolean).join("_")
        );
      }
      const existing = await Campaign.find({ campaignName: new RegExp(`^${cleanCampaignName}`) }).select("campaignName");
      let version = 1;
      if (existing.length > 0) {
        const numbers = existing.map(c => {
          const match = c.campaignName.match(/_v(\d+)$/);
          return match ? parseInt(match[1]) : 1;
        });
        version = Math.max(...numbers) + 1;
      }
      versionedCampaignName = existing.length > 0 ? `${cleanCampaignName}_v${version}` : cleanCampaignName;
    } else {
      const existingDoc = await Campaign.findById(campaignId);
      if (existingDoc && !cleanCampaignName) versionedCampaignName = existingDoc.campaignName;
      
      // Suppression check for live run
      if (existingDoc) {
          const s = existingDoc.suppression;
          if (!s || s.status !== "COMPLETED" || !s.outputFile || typeof s.finalCount !== "number" || s.finalCount <= 0) {
              return res.status(400).json({ error: "run_suppression_first" });
          }
      }
    }

    // BUILD RUNTIME OFFER ID
    let finalOfferId = runtimeOfferId;
    if (offer && !finalOfferId) {
      finalOfferId = buildRuntimeOfferId({ server: senderCode, sid: offer.sid, cid: offer.cid, campaignName: versionedCampaignName, override: runtimeOfferId });
    }
    const versionedOfferId = finalOfferId || "draft_" + Date.now();

    // TRACKING MODE
    const allowedTrackingModes = ["from", "domain"];
    const requestedTrackingMode = String(trackingMode || "from").toLowerCase();
    const finalTrackingMode = allowedTrackingModes.includes(requestedTrackingMode) ? requestedTrackingMode : "from";
    let finalTrackingDomain = null;
    if (finalTrackingMode === "domain") {
      finalTrackingDomain = (trackingDomain && trackingDomain.trim()) || DEFAULT_TRACKING_DOMAIN;
      if (!finalTrackingDomain) return res.status(400).json({ error: "tracking_domain_required_for_domain_mode" });
    }

    // SEND VALIDATIONS
    let parsedTotalSend = parseInt(totalSend, 10);
    if (isNaN(parsedTotalSend) || parsedTotalSend <= 0) {
      return res.status(400).json({ error: "invalid_total_send" });
    }

    let parsedSendSeconds = parseInt(sendInSeconds, 10);
    let parsedSendMinutes = parseInt(sendInMinutes, 10);
    let parsedSendHours = parseInt(sendInHours, 10);

    if ((isNaN(parsedSendSeconds) || parsedSendSeconds <= 0) && (isNaN(parsedSendMinutes) || parsedSendMinutes <= 0) && (isNaN(parsedSendHours) || parsedSendHours <= 0)) {
      return res.status(400).json({ error: "invalid_send_time" });
    }

    let parsedSeedAfter = 0;
    let parsedSeedMode = "round";
    const seedArray = Array.isArray(seeds) ? seeds : (typeof seeds === "string" ? seeds.split(",").map(x => x.trim()).filter(Boolean) : []);

    if (seedAfter !== undefined && seedAfter !== null && Number(seedAfter) > 0) {
      parsedSeedAfter = parseInt(seedAfter, 10);
      if (isNaN(parsedSeedAfter) || parsedSeedAfter <= 0) return res.status(400).json({ error: "invalid_seed_after" });
      if (seedArray.length === 0) return res.status(400).json({ error: "seeds_required_for_seed_after" });
      parsedSeedMode = seedMode === "random" ? "random" : "round";
    }

    const initialStatus = scheduledAt ? "SCHEDULED" : "RUNNING";

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
      status: initialStatus,
      htmlOverride: htmlOverride || null,
      routes: resolvedRoutes,
      liveExecuted: initialStatus === "RUNNING",
      sendConfig: {
        subjectIds: Array.isArray(subjectIds) ? subjectIds : [],
        fromIds: Array.isArray(fromIds) ? fromIds : [],
        headerBlockMode: headerMode || "default",
        customHeaderBlock: customHeaderBlock || "",
        textEncoding: textEncoding || "base64",
        htmlEncoding: htmlEncoding || "base64",
        createdBy: req.user.mongoId,
        mode: "LIVE",
        totalSend: parsedTotalSend,
        sendInSeconds: parsedSendSeconds || undefined,
        sendInMinutes: parsedSendMinutes || undefined,
        sendInHours: parsedSendHours || undefined,
        seeds: seedArray,
        seedAfter: parsedSeedAfter,
        seedMode: parsedSeedMode,
      },
      execution: {
        startedAt: initialStatus === "RUNNING" ? new Date() : null,
        totalSent: 0,
        totalSend: parsedTotalSend,
      }
    };

    if (suppressionConfig && typeof suppressionConfig === "object") {
      updatePayload.suppressionConfig = {
        queueDomain: suppressionConfig.queueDomain || null,
        skipUnsub: suppressionConfig.skipUnsub === true,
        inclusionSegments: Array.isArray(suppressionConfig.inclusionSegments) ? suppressionConfig.inclusionSegments : [],
        exclusionSegments: Array.isArray(suppressionConfig.exclusionSegments) ? suppressionConfig.exclusionSegments : [],
      };
    }

    await Deploy.updateOne(
      { offer_id: versionedOfferId, cid: offer.cid },
      { $set: { sid: offer.sid.toLowerCase(), sponsor: offer.sponsor, offer: offer.offer, redirectLinks: offer.redirectLinks || [], optoutLink: offer.optoutLink, md5FileName: offer.md5FileName, status: "DEPLOYED", deployedAt: new Date() } },
      { upsert: true }
    );

    const action = campaignId ? "update" : "create";
    let resultCampaign;
    if (campaignId) {
      resultCampaign = await Campaign.findByIdAndUpdate(campaignId, { $set: updatePayload }, { new: true });
    } else {
      updatePayload.createdAt = new Date();
      updatePayload.createdBy = req.user.mongoId;
      resultCampaign = await Campaign.create(updatePayload);
    }

    if (initialStatus === "RUNNING") {
        campaignQueue.add("send-campaign", { campaignId: resultCampaign._id }, {
          removeOnComplete: true,
          removeOnFail: 100
        }).catch(err => {
            console.error("CAMPAIGN WORKER START ERROR:", err);
        });
    }

    console.log("[CAMPAIGN OBSERVABILITY] Action: %s, CampaignId: %s, UserId: %s, WizardStep: %s, RequestSource: %s", action, resultCampaign._id, req.user.userId || req.user.mongoId, req.body.step || "unknown", req.body.requestSource || "submit");

    return res.json({
      status: "started",
      campaign: resultCampaign.campaignName,
      campaignId: resultCampaign._id,
      mode: "LIVE"
    });

  } catch (err) {
    console.error("LAUNCH CAMPAIGN ERROR:", err);
    return res.status(500).json({ error: "campaign_launch_failed", message: err.message });
  }
}
