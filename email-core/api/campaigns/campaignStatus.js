import Campaign from "../../models/Campaign.js";
import axios from "axios";
import SenderServer from "../../models/SenderServer.js";

export default async function campaignStatus(req, res) {
  try {
    const rawCampaign = req.params.campaign;

    if (!rawCampaign || typeof rawCampaign !== "string") {
      return res.status(400).json({ error: "invalid_campaign" });
    }

    const campaignName = rawCampaign.trim();

    // 1️⃣ Get campaign from DB (SOURCE OF TRUTH)
    const campaign = await Campaign.findOne({
      campaignName,
    }).lean();

    if (!campaign) {
      return res.status(404).json({ error: "campaign_not_found" });
    }
    
    // If campaign is already FINAL, return immediately
    if (["COMPLETED", "FAILED", "STOPPED"].includes(campaign.status)) {
      return res.json({
        campaign: campaignName,
        status: campaign.status,
        execution: campaign.execution || {},
      });
    }

    // 2️⃣ Otherwise fetch sender live status
    // 2️⃣ Fetch sender from DB
const senderDoc = await SenderServer.findOne({
  _id: campaign.sender,
  active: true,
}).lean();

if (!senderDoc) {
  return res.status(400).json({
    error: "campaign_sender_inactive",
  });
}

const baseUrl = senderDoc.baseUrl.replace(/\/$/, "");
const statusUrl = `${baseUrl}/internal/campaigns/${campaignName}/status.json`;

let senderResponse;

try {
  senderResponse = await axios.get(statusUrl, {
    timeout: 3000,
    validateStatus: () => true,
  });
} catch {
  return res.json({
    campaign: campaignName,
    status: campaign.status || "UNKNOWN",
    execution: campaign.execution || {},
  });
}

if (
  senderResponse.status !== 200 ||
  !senderResponse.data?.status
) {
  return res.json({
    campaign: campaignName,
    status: campaign.status || "UNKNOWN",
    execution: campaign.execution || {},
  });
}

const finalStatus = senderResponse.data.status;

// 🔥 SYNC DB WITH SENDER
if (campaign.status !== finalStatus) {
  await Campaign.updateOne(
    { campaignName },
    { $set: { status: finalStatus } }
  );
}


return res.json({
  campaign: campaignName,
  status: finalStatus,
  execution: campaign.execution || {},
  sender: senderDoc.code || senderDoc.name,
});


  } catch (err) {
    console.error("CAMPAIGN STATUS ERROR:", err.message);
    return res.status(500).json({ error: "status_failed" });
  }
}
