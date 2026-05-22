import Campaign from "../../models/Campaign.js";
import Offer from "../../models/Offer.js";
import Creative from "../../models/Creative.js";
import SenderServer from "../../models/SenderServer.js";

export default async function getCampaign(req, res) {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "campaign_id_required" });
    }

    const campaign = await Campaign.findById(id)
      .populate("offerId")
      .populate("creativeId")
      .populate("sender")
      .lean();

    if (!campaign) {
      return res.status(404).json({ error: "campaign_not_found" });
    }

    res.json({
      success: true,
      data: campaign
    });

  } catch (err) {
    console.error("GET CAMPAIGN ERROR:", err);
    res.status(500).json({ error: "fetch_failed" });
  }
}
