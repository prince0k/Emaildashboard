import express from "express";
import path from "path";
import fs from "fs/promises";
import mongoose from "mongoose";
import os from "os";

import Offer from "../models/Offer.js";
import SuppressionJob from "../models/SuppressionJob.js";
import runSuppressionV2 from "../services/suppressionEngine.js";
import { PATHS } from "../config/paths.js";
import jobsRouter from "./suppression/jobs.js";

import auth from "../middleware/auth.js";
import checkPermission from "../middleware/checkPermission.js";

const router = express.Router();

router.use(auth);
router.use(checkPermission("suppression.manage"));

router.use("/jobs", jobsRouter);

/* =========================================================
   POST /api/suppression/portal
========================================================= */
router.post("/portal", async (req, res) => {
  try {
    const { offerId, inputFile } = req.body;

    if (!offerId || !inputFile) {
      return res.status(400).json({
        error: "offerId_and_inputFile_required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(offerId)) {
      return res.status(400).json({
        error: "invalid_offer_id",
      });
    }

    const safeInput = path.basename(String(inputFile));

    if (!/\.txt$/i.test(safeInput)) {
      return res.status(400).json({
        error: "invalid_segment_format",
      });
    }

    const segmentPath = path.join(PATHS.segments, safeInput);
    try {
      await fs.access(segmentPath);
    } catch {
      return res.status(400).json({
        error: "Missing Segment File",
        message: `The file '${safeInput}' was not found on the server.`
      });
    }

    /* ---------- FETCH OFFER ---------- */
    const offer = await Offer.findOne({
      _id: offerId,
      isActive: true,
      isDeleted: false,
    }).lean();

    if (!offer) {
      return res.status(404).json({
        error: "offer_not_found_or_inactive",
      });
    }

    if (!offer.md5FileName) {
      return res.status(500).json({
        error: "offer_md5_not_configured",
      });
    }

    const md5FileName = offer.md5FileName.endsWith(".sorted.txt")
      ? offer.md5FileName
      : offer.md5FileName.replace(/\.txt$/i, ".sorted.txt");

    const md5Path = path.join(PATHS.md5, md5FileName);
    try {
      await fs.access(md5Path);
    } catch {
      return res.status(400).json({
        error: "Missing Offer MD5",
        message: `The MD5 hash file for this offer was not found on the server.`
      });
    }

    /* ---------- CREATE JOB (RUNNING STATE FIRST) ---------- */
    const job = await SuppressionJob.create({
      offerId: offer._id,
      sponsor: offer.sponsor,
      cid: offer.cid,
      offer: offer.offer,
      sid: offer.sid,
      inputFile: safeInput,
      md5FileName,
      status: "RUNNING",
      createdBy: req.user.mongoId,
      serverName: process.env.SERVER_NAME || os.hostname(),
      startedAt: new Date(),
    });

    try {
      /* ---------- RUN SUPPRESSION ---------- */
      const result = await runSuppressionV2({
        inputPath: segmentPath,
        outputDir: PATHS.output,
        md5Path,
        globalPath: path.join(PATHS.global, "normalized.txt"),
        unsubPath: path.join(PATHS.unsub, "sender.txt"),
        complaintPath: path.join(PATHS.complaint, "complaint.txt"),
        bouncePath: path.join(PATHS.bounce, "hard.txt"),
      });

      const s = result.stats;

      job.counts = s;
      job.finalCount = s.kept;
      job.outputFile = result.outputFile;
      job.status = "DONE";
      job.completedAt = new Date();

      await job.save();

      return res.json({
        jobId: job._id,
        stats: s,
        downloadUrl: `/output/${job.outputFile}`,
      });

    } catch (suppressionError) {
      job.status = "FAILED";
      job.errorMessage = suppressionError.message;
      job.completedAt = new Date();
      await job.save();

      throw suppressionError;
    }

  } catch (err) {
    console.error("SUPPRESSION PORTAL ERROR:", err);

    return res.status(500).json({
      error: "suppression_failed",
      message: err.message,
    });
  }
});

export default router;