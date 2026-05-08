import mongoose from "mongoose";
import { syncGoogleSheet as syncSingleSheet } from "../services/googleSheetSync.js";
import { syncGoogleSheet as syncIPSheet } from "../services/googleSheetSync2.js";
import dotenv from "dotenv";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

async function runAllSyncs() {
  await syncSingleSheet();
  await syncIPSheet();
}

async function start() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Mongo connected (Sheet Worker)");

    console.log("🚀 Running first sync...");
    await runAllSyncs();

    setInterval(async () => {
      try {
        console.log("🔄 Running All Sheet Sync...");
        await runAllSyncs();
      } catch (err) {
        console.error("❌ Sync Error:", err.message);
      }
    }, 1 * 30 * 1000);

  } catch (err) {
    console.error("❌ Worker failed:", err);
    process.exit(1);
  }
}

start();