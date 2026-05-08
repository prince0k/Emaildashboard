import Campaign from "../../models/Campaign.js";
import Deploy from "../../models/Deploy.js";
import { callSender } from "./helpers/senderBridge.js";
import SubjectLine from "../../models/SubjectLine.js";
import FromLine from "../../models/FromLine.js";
import SenderServer from "../../models/SenderServer.js";

export default async function reviewCampaign(req, res) {
  try {
    let { campaign } = req.params;

    /* ================= PERMISSION GUARD ================= */

    if (
      req.user.role !== "super_admin" &&
      !req.user.permissions?.includes("campaign.review")
    ) {
      return res.status(403).json({ error: "forbidden" });
    }

    if (!campaign || typeof campaign !== "string") {
      return res.status(400).json({ error: "invalid_campaign" });
    }

    campaign = decodeURIComponent(campaign).trim();

    if (!/^[a-zA-Z0-9_-]+$/.test(campaign)) {
      return res.status(400).json({ error: "invalid_campaign_name" });
    }

    const campaignDoc = await Campaign.findOne({
      campaignName: campaign,
    })
    .populate("sender", "name dba")
    .lean();

    if (!campaignDoc) {
      return res.status(404).json({ error: "campaign_not_found" });
    }

    /* ===============================
       FETCH DEPLOY DATA
    =============================== */

    const deployDoc = await Deploy.findOne({
      offer_id: campaignDoc.runtimeOfferId,
    }).lean();

    /* ===============================
   FETCH SUBJECT & FROM (OFFER BASED)
================================ */

let subjectLines = [];
let fromLines = [];

if (campaignDoc.offerId) {
  const subjectDocs = await SubjectLine.find({
    offerId: campaignDoc.offerId,
  }).lean();

  const fromDocs = await FromLine.find({
    offerId: campaignDoc.offerId,
  }).lean();

  subjectLines = subjectDocs.map((s) => s.text);
  fromLines = fromDocs.map((f) => f.text);
}


    /* ===============================
       FETCH CREATIVE FROM SENDER
    =============================== */

    let creativeHtml = "";

    try {
      const creativeRes = await callSender(
        campaignDoc.sender?._id,
        "getCreative.php",
        { campaignName: campaignDoc.campaignName },
        "GET"
      );

      if (creativeRes?.activeHtml) {
        creativeHtml = creativeRes.activeHtml;
      }
    } catch (err) {
      console.error("CREATIVE LOAD FAILED:", err.message);
    }

    const senderWithRoutes = campaignDoc.sender?._id
      ? await SenderServer.findById(campaignDoc.sender._id)
          .select("routes")
          .lean()
      : null;

    const availableRoutes = Array.isArray(senderWithRoutes?.routes)
      ? senderWithRoutes.routes.filter((r) => r?.active !== false)
      : [];

    return res.json({
  campaignName: campaignDoc.campaignName,
  senderServerId: campaignDoc.sender?.name || null,
  dba: campaignDoc.sender?.dba || null,
  offerId: campaignDoc.offerId,
  runtimeOfferId: campaignDoc.runtimeOfferId,
  isp: campaignDoc.isp,
  segmentName: campaignDoc.segmentName,
  routes: campaignDoc.routes || [],
  availableRoutes,
  status: campaignDoc.status,

  trackingMode: campaignDoc.trackingMode || "from",
  trackingDomain: campaignDoc.trackingDomain || "",

  suppression: campaignDoc.suppression || null,
  suppressionRunAt: campaignDoc.suppressionRunAt || null,

  deployedAt:
    campaignDoc.deployedAt ||
    deployDoc?.deployedAt ||
    null,

  redirectLinks: deployDoc?.redirectLinks || [],
  optoutLink: deployDoc?.optoutLink || null,

  creativeHtml,
  subjectLines,
  fromLines,

  // 🔥 ADD THIS
  sendConfig: campaignDoc.sendConfig || null,
});

  } catch (err) {
    console.error("REVIEW CAMPAIGN ERROR:", err);

    return res.status(500).json({
      error: "review_failed",
      message: err.message,
    });
  }
}
