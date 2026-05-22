import mongoose from "mongoose";
import Campaign from "../models/Campaign.js";
import { campaignQueue } from "../queue/campaignQueue.js";
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

        // Enqueue to BullMQ instead of starting directly
        await campaignQueue.add("send-campaign", { campaignId: campaign._id }, {
          removeOnComplete: true,
          removeOnFail: 100 // keep history of failed
        });

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
