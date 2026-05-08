import Campaign from "../../models/Campaign.js";

export default async function deleteCampaign(req, res) {
  try {
    const { campaignId } = req.body;

    if (!campaignId) {
      return res.status(400).json({
        error: "campaignId_required",
      });
    }

    const campaign = await Campaign.findById(campaignId);

    if (!campaign) {
      return res.status(404).json({
        error: "campaign_not_found",
      });
    }

    // ❌ prevent deleting running campaign
    if (campaign.status === "RUNNING") {
      return res.status(400).json({
        error: "cannot_delete_running_campaign",
      });
    }

    // ✅ soft delete
    campaign.isDeleted = true;
    campaign.deletedAt = new Date();

    await campaign.save();

    return res.json({
      status: "deleted",
    });

  } catch (err) {
    console.error("DELETE CAMPAIGN ERROR:", err);

    return res.status(500).json({
      error: "delete_failed",
      message: err.message,
    });
  }
}