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

    const copyData = {
      sender: original.sender,

      // 👇 user can change these
      creativeId: original.creativeId,
      offerId: original.offerId,

      isp: original.isp,
      segmentName: original.segmentName,

      // ✅ deep clone (safe)
      routes: JSON.parse(JSON.stringify(original.routes)),

      trackingMode: original.trackingMode,
      trackingDomain: original.trackingDomain,

      // 👇 always reset
      scheduledDate: null,
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