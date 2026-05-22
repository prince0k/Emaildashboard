import mongoose from "mongoose";
import dotenv from "dotenv";
import { startCampaignWorker } from "./campaignSenderWorker.js";
import { campaignQueue } from "../queue/campaignQueue.js";

dotenv.config();

export async function startBullWorker() {
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI);
      console.log("🔗 BullWorker connected to DB");
    } else {
      console.log("🔗 BullWorker using existing DB connection");
    }

    campaignQueue.process("send-campaign", 50, async (job) => {
      console.log(`\n📥 Received campaign job: ${job.id} - Campaign ID: ${job.data.campaignId}`);
      await startCampaignWorker(job.data.campaignId);
    });

    campaignQueue.on("completed", (job) => {
      console.log(`✅ Job ${job.id} completed successfully`);
    });

    campaignQueue.on("failed", (job, err) => {
      console.error(`❌ Job ${job.id} failed:`, err);
    });

    campaignQueue.on("stalled", (job) => {
      console.warn(`⚠️ Job ${job.id} stalled — it will be retried automatically`);
    });

    campaignQueue.on("error", (err) => {
      console.error("🔥 Bull queue error:", err);
    });

    console.log(`👷 BullWorker is listening for jobs`);
  } catch (err) {
    console.error("BullWorker failed to start:", err);
  }
}
