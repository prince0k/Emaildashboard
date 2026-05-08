import connectDB from "../config/mongo.js";
import { fetchComplaintEmails } from "../services/complaintFetcher.js";

let isRunning = false;

const start = async () => {
  // 🔥 WAIT FOR DB
  await connectDB();

  console.log("🚀 Worker started");

  setInterval(run, 2 * 60 * 1000);
  run();
};

const run = async () => {
  if (isRunning) return;

  isRunning = true;

  try {
    await fetchComplaintEmails();
  } catch (e) {
    console.error("❌ Worker error:", e);
  } finally {
    isRunning = false;
  }
};

start();