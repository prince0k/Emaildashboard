import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import { syncCampaignCreateSheet } from "../services/googleSheetCampaignCreate.js";

async function start() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI missing in .env");
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Mongo Connected (Campaign Worker)");

    console.log("🚀 Initial Sync...");
    await syncCampaignCreateSheet();

    setInterval(async () => {
      try {
        console.log("🔄 Running Campaign Create Sync...");
        await syncCampaignCreateSheet();
      } catch (err) {
        console.error("❌ Worker Loop Error:", err.message);
      }
    }, 30 * 1000);

  } catch (err) {
    console.error("❌ Worker Failed:", err.message);
    process.exit(1);
  }
}

start();