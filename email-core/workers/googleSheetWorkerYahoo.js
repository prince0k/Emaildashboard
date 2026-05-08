import mongoose from "mongoose";
import { syncGoogleSheet } from "../services/googleSheetSyncYahoo.js";
import dotenv from "dotenv";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

async function start() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Mongo connected (Sheet Worker)");

    console.log("🚀 Running first sync...");
    await syncGoogleSheet();

    setInterval(async () => {
      try {
        console.log("🔄 Running Google Sheet Sync...");
        await syncGoogleSheet();
      } catch (err) {
        console.error("❌ Sync Error:", err.message);
      }
    }, 5 * 60 * 1000);

  } catch (err) {
    console.error("❌ Worker failed:", err);
    process.exit(1);
  }
}

start();