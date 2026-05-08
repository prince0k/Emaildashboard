export async function getCampaignStatus(req, res) {
  try {
    const { campaign } = req.params;

    const campaignDoc = await Campaign.findOne({
      campaignName: campaign,
    });

    if (!campaignDoc) {
      return res.status(404).json({ error: "campaign_not_found" });
    }

    const senderDoc = await SenderServer.findById(campaignDoc.sender);

    const status = await callSender(
      senderDoc._id,
      "getStatus.php",
      {
        campaignName: campaignDoc.campaignName
      }
    );

    return res.json({
      campaign: campaignDoc.campaignName,
      execution: campaignDoc.execution, // 🔥 fallback data
      status: status || {}
    });

  } catch (err) {
    return res.status(500).json({
      error: "status_fetch_failed",
      message: err.message
    });
  }
}