import mongoose from "mongoose";
import { createSubjectLine } from "../../../services/subjectLineService.js";
import auth from "../../../middleware/auth.js";
import checkPermission from "../../../middleware/checkPermission.js";

const handler = async (req, res) => {
  try {
    const { offerId, text } = req.body;

    if (!offerId || !text || !String(text).trim()) {
      return res.status(400).json({
        error: "missing_required_fields",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(offerId)) {
      return res.status(400).json({
        error: "invalid_offer_id",
      });
    }

    const cleanedText = String(text).trim();

    const subject = await createSubjectLine({
      offerId,
      text: cleanedText,
      status: "active",
      createdBy: req.user.id,
      createdAt: new Date(),
    });

    return res.status(201).json(subject);

  } catch (err) {
    console.error("CREATE SUBJECT LINE ERROR:", err);
    return res.status(500).json({
      error: "subject_line_creation_failed",
    });
  }
};

export default [
  auth,
  checkPermission("offer.edit"),
  handler,
];