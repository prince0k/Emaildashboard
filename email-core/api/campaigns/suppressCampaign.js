import Campaign from "../../models/Campaign.js";
import Offer from "../../models/Offer.js";
import SenderServer from "../../models/SenderServer.js";
import runSuppressionV2 from "../../services/suppressionEngine.js";
import SuppressionJob from "../../models/SuppressionJob.js";
import path from "path";
import fs from "fs/promises";
import { PATHS } from "../../config/paths.js";

async function prepareTrimmedSegment(originalPath, limit, direction) {
  if (limit <= 0) {
    return { path: originalPath, isTemp: false };
  }

  const content = await fs.readFile(originalPath, "utf8");
  const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0);

  let trimmedLines;
  if (direction === "bottom") {
    trimmedLines = lines.slice(Math.max(0, lines.length - limit));
  } else {
    trimmedLines = lines.slice(0, limit);
  }

  const tempName = `_temp_supp_${Date.now()}_${Math.random().toString(36).substring(7)}.txt`;
  const tempPath = path.join(path.dirname(originalPath), tempName);
  await fs.writeFile(tempPath, trimmedLines.join("\n"));

  return { path: tempPath, isTemp: true };
}

export default async function suppressCampaign(req, res) {
  let job = null;
  const tempFilesToClean = [];
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

    let inputPath = path.join(PATHS.segments, campaignDoc.segmentName);
    let segmentExists = false;

    try {
      await fs.access(inputPath);
      segmentExists = true;
    } catch {
      if (!campaignDoc.segmentName.endsWith(".txt")) {
        const altPath = path.join(PATHS.segments, `${campaignDoc.segmentName}.txt`);
        try {
          await fs.access(altPath);
          inputPath = altPath;
          segmentExists = true;
        } catch {}
      }
    }

    if (!segmentExists) {
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

    /* ================= RESOLVE QUEUE DOMAIN ================= */

    const suppConfig = campaignDoc.suppressionConfig || {};

    let queueDomain = suppConfig.queueDomain || null;

    // Auto-resolve from sender routes if not manually set
    if (!queueDomain && campaignDoc.sender) {
      const senderDoc = await SenderServer.findById(campaignDoc.sender).lean();
      if (senderDoc?.routes?.length > 0) {
        // Use the first route's domain
        queueDomain = senderDoc.routes[0].domain?.toLowerCase() || null;
      }
    }

    /* ================= BUILD DOMAIN FILE PATHS ================= */

    let domainComplaintPath = null;
    let domainUnsubPath = null;

    if (queueDomain) {
      // Ensure domain directories exist
      await fs.mkdir(PATHS.domainComplaint, { recursive: true });
      await fs.mkdir(PATHS.domainUnsub, { recursive: true });

      domainComplaintPath = path.join(PATHS.domainComplaint, `${queueDomain}.txt`);
      domainUnsubPath = path.join(PATHS.domainUnsub, `${queueDomain}.txt`);
    }

    /* ================= BUILD INCLUSION/EXCLUSION PATHS ================= */

    const inclusionPaths = [];
    const inclusionLimits = [];
    const exclusionPaths = [];
    const exclusionLimits = [];

    if (Array.isArray(suppConfig.inclusionSegments)) {
      for (const seg of suppConfig.inclusionSegments) {
        if (seg.filename) {
          const safeName = path.basename(seg.filename);
          const segPath = path.join(PATHS.segments, safeName);
          const limit = seg.limit || 0;
          const direction = seg.direction || "top";

          const trimmed = await prepareTrimmedSegment(segPath, limit, direction);
          if (trimmed.isTemp) {
            tempFilesToClean.push(trimmed.path);
          }
          inclusionPaths.push(trimmed.path);
          inclusionLimits.push(0); // set limit to 0 since pre-trimmed
        }
      }
    }

    if (Array.isArray(suppConfig.exclusionSegments)) {
      for (const seg of suppConfig.exclusionSegments) {
        if (seg.filename) {
          const safeName = path.basename(seg.filename);
          const segPath = path.join(PATHS.segments, safeName);
          const limit = seg.limit || 0;
          const direction = seg.direction || "top";

          const trimmed = await prepareTrimmedSegment(segPath, limit, direction);
          if (trimmed.isTemp) {
            tempFilesToClean.push(trimmed.path);
          }
          exclusionPaths.push(trimmed.path);
          exclusionLimits.push(0); // set limit to 0 since pre-trimmed
        }
      }
    }

    const skipUnsub = suppConfig.skipUnsub === true;

    /* ================= CREATE SUPPRESSION JOB ================= */

    job = await SuppressionJob.create({
      offerId: offerDoc._id,
      sponsor: offerDoc.sponsor,
      cid: offerDoc.cid,
      offer: offerDoc.offer,
      sid: offerDoc.sid,
      inputFile: campaignDoc.segmentName,
      md5FileName: offerDoc.md5FileName,
      queueDomain: queueDomain || null,
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
      domainComplaintPath,
      domainUnsubPath,
      skipUnsub,
      inclusionPaths,
      inclusionLimits,
      exclusionPaths,
      exclusionLimits,
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
      unsubscribe: s.unsubscribe || 0,
      complaint: s.complaint || 0,
      domain_complaint: s.domain_complaint || 0,
      domain_unsub: s.domain_unsub || 0,
      bounce: s.bounce || 0,
      exclusion_removed: s.exclusion_removed || 0,
      inclusion_added: s.inclusion_added || 0,
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

      status: "COMPLETED",

      inputCount: normalizedStats.input,
      finalCount: normalizedStats.kept,
      removedCount: normalizedStats.input - normalizedStats.kept,
      breakdown: normalizedStats,

      outputFile: suppressionResult.outputFile,
      statsPath: suppressionResult.statsPath,

      runAt: new Date(),

      isCompleted: true,
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
} finally {
  for (const tempFile of tempFilesToClean) {
    await fs.unlink(tempFile).catch(() => {});
  }
}
}