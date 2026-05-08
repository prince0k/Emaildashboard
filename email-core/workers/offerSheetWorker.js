import mongoose from "mongoose";
import dotenv from "dotenv";
import { syncOfferSheet } from "../services/googleSheetOfferSync.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

async function start() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Mongo connected (Offer Sync)");

    console.log("🚀 Running first sync...");
    await syncOfferSheet();

    setInterval(async () => {
      try {
        console.log("🔄 Offer Sheet Sync Running...");
        await syncOfferSheet();
      } catch (err) {
        console.error("❌ Sync Error:", err.message);
      }
    }, 30 * 1000);

  } catch (err) {
    console.error("❌ Worker failed:", err);
    process.exit(1);
  }
}

start();