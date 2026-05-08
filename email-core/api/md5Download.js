import express from "express";
import { processOffer } from "../services/md5DownloadService.js";
import auth from "../middleware/auth.js";
import { v4 as uuidv4 } from "uuid";
import pLimit from "p-limit";
import { fork } from "child_process";
import {
  initProgress,
  updateSuccess,
  updateFail,
  markDone,
} from "../services/md5ProgressStore.js";
const router = express.Router();

/**
 * POST /api/md5-download
 * body: { offerIds: ["65fa...", "65fb..."] }
 */
router.post("/md5-download", auth, async (req, res) => {
    console.log("MD5 BODY:", req.body)
  try {
    const { offerIds } = req.body;

    if (!Array.isArray(offerIds) || !offerIds.length) {
      return res.status(400).json({
        success: false,
        message: "Invalid offerIds list",
      });
    }

// 🔥 STEP 1: instant response (IMPORTANT)
const jobId = uuidv4();

// init progress
initProgress(jobId, offerIds.length);

// background processing FIRST
setImmediate(async () => {
  console.log("🚀 BACKGROUND MD5 START", jobId);

  const limit = pLimit(1); // max 2 parallel

await Promise.allSettled(
  offerIds.map((offerId) =>
    limit(async () => {
      try {
        console.log("Processing:", offerId);

        await processOffer(offerId);

        updateSuccess(jobId);
        console.log("✅ Done:", offerId);
      } catch (err) {
        updateFail(jobId);
        console.error("❌ Failed:", offerId, err.message);
      }
    })
  )
);

  markDone(jobId);
  console.log("🎯 ALL MD5 DONE", jobId);
});

// ✅ THEN return response
return res.json({
  success: true,
  jobId,
});

  } catch (err) {
  console.error("MD5 DOWNLOAD ERROR:", err);

  if (!res.headersSent) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}
});

export default router;
