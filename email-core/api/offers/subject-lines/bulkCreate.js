import mongoose from "mongoose";
import { bulkCreateSubjectLines } from "../../../services/subjectLineService.js";
import auth from "../../../middleware/auth.js";
import checkPermission from "../../../middleware/checkPermission.js";

const handler = async (req, res) => {
  try {
    const { offerId, textBlock } = req.body;

    if (!offerId || !textBlock) {
      return res.status(400).json({
        error: "missing_required_fields",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(offerId)) {
      return res.status(400).json({
        error: "invalid_offer_id",
      });
    }

    const lines = textBlock
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length === 0) {
      return res.status(400).json({
        error: "no_valid_lines_provided",
      });
    }

    const uniqueLines = [...new Set(lines)];

    const result = await bulkCreateSubjectLines(
      offerId,
      uniqueLines,
      req.user.id // pass creator for audit
    );

    return res.status(201).json(result);

  } catch (err) {
    console.error("BULK SUBJECT LINE ERROR:", err);
    return res.status(500).json({
      error: "subject_bulk_creation_failed",
    });
  }
};

export default [
  auth,
  checkPermission("offer.edit"),
  handler,
];