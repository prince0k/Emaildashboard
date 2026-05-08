import express from "express";
import mongoose from "mongoose";
import SuppressionJob from "../../models/SuppressionJob.js";

import auth from "../../middleware/auth.js";
import checkPermission from "../../middleware/checkPermission.js";

const router = express.Router();

/*
  GET /api/suppression/jobs
*/
router.get(
  "/",
  auth,
  checkPermission("suppression.view"),
  async (req, res) => {
    try {
      const limit = Math.min(
        parseInt(req.query.limit, 10) || 50,
        200
      );

      const page = Math.max(
        parseInt(req.query.page, 10) || 1,
        1
      );

      const skip = (page - 1) * limit;

      const filter = {};

      if (req.query.offerId) {
        if (!mongoose.Types.ObjectId.isValid(req.query.offerId)) {
          return res.status(400).json({
            error: "invalid_offer_id",
          });
        }

        filter.offerId = req.query.offerId;
      }

      if (req.query.status) {
        filter.status = req.query.status;
      }

      const [jobs, total] = await Promise.all([
        SuppressionJob.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),

        SuppressionJob.countDocuments(filter),
      ]);

      return res.json({
        total,
        page,
        pages: Math.ceil(total / limit),
        jobs,
      });

    } catch (err) {
      console.error("SUPPRESSION JOBS ERROR:", err);
      return res.status(500).json({
        error: "failed_to_load_jobs",
      });
    }
  }
);

export default router;