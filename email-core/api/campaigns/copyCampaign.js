import Campaign from "../../models/Campaign.js";

export default async function copyCampaign(req, res) {
  try {
    const { campaignId } = req.body;

    if (!campaignId) {
      return res.status(400).json({
        error: "campaignId_required",
      });
    }

    /* ================= FETCH ORIGINAL ================= */

    const original = await Campaign.findById(campaignId).lean();

    if (!original) {
      return res.status(404).json({
        error: "campaign_not_found",
      });
    }

    /* ================= BUILD COPY DATA ================= */

    let copyName = original.campaignName ? `${original.campaignName}_copy` : "";
    let runtimeOfferIdCopy = original.runtimeOfferId ? `${original.runtimeOfferId}_copy` : "";

    if (copyName) {
      const baseCampaignName = copyName;
      const existing = await Campaign.find({
        campaignName: new RegExp(`^${baseCampaignName}`)
      }).select("campaignName").lean();

      if (existing.length > 0) {
        let version = 1;
        const numbers = existing.map(c => {
          const match = c.campaignName.match(/_v(\d+)$/);
          return match ? parseInt(match[1]) : 1;
        });
        version = Math.max(...numbers) + 1;
        copyName = `${baseCampaignName}_v${version}`;
        if (runtimeOfferIdCopy) {
          runtimeOfferIdCopy = `${runtimeOfferIdCopy}_v${version}`;
        }
      }
    }

    const copyData = {
      campaignName: copyName,
      runtimeOfferId: runtimeOfferIdCopy,
      sender: original.sender,

      // 👇 user can change these
      creativeId: original.creativeId,
      offerId: original.offerId,

      creativeVersion: original.creativeVersion || 1,
      htmlOverride: original.htmlOverride || null,
      openTriggerCampaignId: original.openTriggerCampaignId || null,

      isp: original.isp,
      segmentName: original.segmentName,

      // ✅ deep clone (safe)
      routes: original.routes ? JSON.parse(JSON.stringify(original.routes)) : [],

      trackingMode: original.trackingMode,
      trackingDomain: original.trackingDomain,

      suppressionConfig: original.suppressionConfig ? JSON.parse(JSON.stringify(original.suppressionConfig)) : undefined,
      sendConfig: original.sendConfig ? JSON.parse(JSON.stringify(original.sendConfig)) : undefined,
      environment: original.environment,

      // 👇 always reset
      scheduledDate: null,
      scheduledAt: null,
    };

    /* ================= RETURN (NO CREATE) ================= */

    return res.json({
      status: "success",
      data: copyData,
    });

  } catch (err) {
    console.error("COPY CAMPAIGN ERROR:", err);

    return res.status(500).json({
      error: "copy_failed",
      message: err.message,
    });
  }
}