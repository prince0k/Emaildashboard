import mongoose from "mongoose";
import dotenv from "dotenv";
import { runPmtaMonitor } from "./pmtaMonitorWorker.js";

dotenv.config();

/* =========================
   DB CONNECT
========================= */

async function startScheduler() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Mongo connected");
  } catch (err) {
    console.error("❌ Mongo connection failed:", err.message);
    process.exit(1);
  }

  console.log("🚀 PMTA Scheduler started");

  let isRunning = false; // 🔥 prevent overlap

  setInterval(async () => {
    if (isRunning) {
      console.log("⏳ Previous run still in progress... skipping");
      return;
    }

    isRunning = true;

    console.log("⏱️ Scheduler tick:", new Date().toISOString());

    try {
      await runPmtaMonitor();
      console.log("✅ Worker completed");
    } catch (err) {
      console.error("❌ Worker error:", err.message);
    } finally {
      isRunning = false;
    }
  }, 5000);
}

startScheduler();