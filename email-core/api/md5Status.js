import express from "express";
import { getProgress } from "../services/md5ProgressStore.js";

const router = express.Router();

router.get("/md5-status/:jobId", (req, res) => {
  const job = getProgress(req.params.jobId);

  if (!job) {
    return res.status(404).json({ message: "Job not found" });
  }

  res.json(job);
});

export default router;