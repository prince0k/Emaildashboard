import Campaign from "../../models/Campaign.js";
import Offer from "../../models/Offer.js";
import runSuppressionV2 from "../../services/suppressionEngine.js";
import SuppressionJob from "../../models/SuppressionJob.js";
import path from "path";
import fs from "fs/promises";
import { PATHS } from "../../config/paths.js";

export default async function suppressCampaign(req, res) {
  let job = null;
  try {
    const { campaign } = req.params;

    const campaignDoc = await Campaign.findOne({
      campaignName: campaign,
    });

    if (!campaignDoc) {
      return res.status(404).json({ error: "campaign_not_found" });
    }

    if (!campaignDoc.segmentName) {
      return res.status(400).json({
        error: "segment_name_missing",
      });
    }

    let previousSuppression = null;

    if (campaignDoc.suppression?.isCompleted) {

      const lastRun = new Date(campaignDoc.suppression.runAt);
      const now = new Date();
      const diffHours = (now - lastRun) / (1000 * 60 * 60);

      if (diffHours < 12) {
        previousSuppression = campaignDoc.suppression;
      }

    }

    /* ================= VERIFY SEGMENT ================= */

    const inputPath = path.join(PATHS.segments, campaignDoc.segmentName);

    try {
      await fs.access(inputPath);
    } catch {
      return res.status(400).json({
        error: "segment_file_not_found",
        path: inputPath,
      });
    }

    /* ================= FETCH OFFER ================= */

    const offerDoc = await Offer.findById(
      campaignDoc.offerId
    ).lean();

    if (!offerDoc) {
      return res.status(400).json({
        error: "offer_not_found",
      });
    }

    if (!offerDoc.md5FileName) {
      return res.status(400).json({
        error: "offer_md5_missing",
      });
    }

   let md5Path = null;

// Prefer sorted file first
const sortedName = offerDoc.md5FileName.endsWith(".sorted.txt")
  ? offerDoc.md5FileName
  : offerDoc.md5FileName.replace(/\.txt$/i, ".sorted.txt");

const sortedPath = path.join(PATHS.md5, sortedName);

try {
  await fs.access(sortedPath);
  md5Path = sortedPath;
} catch {
  // fallback to original file
  const rawPath = path.join(PATHS.md5, offerDoc.md5FileName);

  try {
    await fs.access(rawPath);
    md5Path = rawPath;
  } catch {
    return res.status(400).json({
      error: "md5_file_not_found",
      tried: [sortedPath, rawPath]
    });
  }
}


    /* ================= CREATE SUPPRESSION JOB ================= */

    job = await SuppressionJob.create({
      offerId: offerDoc._id,
      sponsor: offerDoc.sponsor,
      cid: offerDoc.cid,
      offer: offerDoc.offer,
      sid: offerDoc.sid,
      inputFile: campaignDoc.segmentName,
      md5FileName: offerDoc.md5FileName,
      status: "RUNNING",
      createdBy: req.user.id,
      startedAt: new Date(),
    });

    /* ================= RUN SUPPRESSION ================= */

    const suppressionResult = await runSuppressionV2({
      inputPath,
      outputDir: PATHS.output,
      md5Path,
      globalPath: path.join(PATHS.global, "normalized.txt"),
      unsubPath: path.join(PATHS.unsub, "sender.txt"),
      complaintPath: path.join(PATHS.complaint, "complaint.txt"),
      bouncePath: path.join(PATHS.bounce, "hard.txt"),
    });

    if (!suppressionResult?.outputFile || !suppressionResult?.stats) {
      throw new Error("Suppression engine returned invalid result");
    }

    const s = suppressionResult.stats;

    const normalizedStats = {
      input: s.input || 0,
      invalid: s.invalid || 0,
      duplicates: s.duplicates || 0,
      offer_md5: s.offer_md5 || s.breakdown?.offerMd5 || 0,
      global: s.global || 0,
      unsubscribe: s.unsub || 0,
      complaint: s.complaint || 0,
      bounce: s.bounce || 0,
      kept: s.kept || s.final || 0,
    };

    /* ================= UPDATE SUPPRESSION JOB ================= */

    job.counts = normalizedStats;
    job.finalCount = normalizedStats.kept;
    job.outputFile = suppressionResult.outputFile;
    job.status = "DONE";
    job.completedAt = new Date();

    await job.save();

    if (normalizedStats.kept === 0) {
      return res.status(400).json({
        error: "no_records_after_suppression",
      });
    }

    /* ================= SAVE TO CAMPAIGN ================= */

    campaignDoc.suppression = {
      jobId: job._id,

      status: "COMPLETED",   // 🔥 ADD THIS (CRITICAL)

      inputCount: normalizedStats.input,
      finalCount: normalizedStats.kept,
      removedCount: normalizedStats.input - normalizedStats.kept,
      breakdown: normalizedStats,

      outputFile: suppressionResult.outputFile,
      statsPath: suppressionResult.statsPath,

      runAt: new Date(),

      isCompleted: true, // optional (can remove later)
    };

    await campaignDoc.save();

    return res.json({
      suppression: campaignDoc.suppression,
      previousSuppression
    });

  } catch (err) {

  console.error("SUPPRESSION ERROR:", err);

  if (job) {
    job.status = "FAILED";
    job.errorMessage = err.message;
    job.completedAt = new Date();
    await job.save();
  }

  return res.status(500).json({
    error: "suppression_failed",
    message: err.message,
  });
}
}