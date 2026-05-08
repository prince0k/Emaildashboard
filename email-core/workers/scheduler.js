import mongoose from "mongoose";
import Campaign from "../models/Campaign.js";
import { callSender } from "../api/campaigns/helpers/senderBridge.js";
import { buildRoutes } from "../api/campaigns/helpers/buildRoutes.js";
import dotenv from "dotenv";

dotenv.config();

/* ======================================================
   CONNECT DB
====================================================== */

await mongoose.connect(process.env.MONGO_URI);

console.log("Scheduler connected to DB");

/* ======================================================
   MAIN LOOP
====================================================== */

async function checkScheduledCampaigns() {
  try {
    const now = new Date();

    const campaigns = await Campaign.find({
      status: "SCHEDULED",
      scheduledAt: { $lte: now },
    });

    if (campaigns.length === 0) return;

    console.log(`Found ${campaigns.length} scheduled campaign(s)`);

    for (const campaign of campaigns) {
      try {
        console.log(`Starting campaign: ${campaign.campaignName}`);

        const payload = {
          campaignName: campaign.campaignName,
          mode: "LIVE",
          routes: buildRoutes(campaign.routes),
          totalSend: campaign.totalSend,
          sendInMinutes: campaign.sendInMinutes || 60,
          offerId: campaign.runtimeOfferId,
        };

        const senderResponse = await callSender(
          campaign.senderId,
          "runCampaign.php",
          payload
        );

        if (!senderResponse || senderResponse.error) {
          console.error("Sender failed:", senderResponse);

          campaign.status = "FAILED";
          await campaign.save();
          continue;
        }

        campaign.status = "RUNNING";
        campaign.startedAt = new Date();
        await campaign.save();

        console.log(`Campaign ${campaign.campaignName} started`);
      } catch (err) {
        console.error("Campaign start error:", err.message);
      }
    }
  } catch (err) {
    console.error("Scheduler error:", err.message);
  }
}

/* ======================================================
   INTERVAL LOOP
====================================================== */

setInterval(checkScheduledCampaigns, 10000); // every 10 seconds

console.log("Scheduler running every 10 seconds");
