import mongoose from "mongoose";
import FromLine from "../../../models/FromLine.js";
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

    // Split lines safely
    const lines = textBlock
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length === 0) {
      return res.status(400).json({
        error: "no_valid_lines_provided",
      });
    }

    // Remove duplicates inside request
    const uniqueLines = [...new Set(lines)];

    // Fetch existing (exclude soft deleted)
    const existing = await FromLine.find({
      offerId,
      text: { $in: uniqueLines },
      isDeleted: false,
    }).select("text");

    const existingTexts = existing.map((item) => item.text);

    const newLines = uniqueLines.filter(
      (line) => !existingTexts.includes(line)
    );

    if (newLines.length === 0) {
      return res.json({
        message: "no_new_from_lines",
        inserted: 0,
      });
    }

    const docs = newLines.map((text) => ({
      offerId,
      text,
      createdBy: req.user.id,
      createdAt: new Date(),
    }));

    await FromLine.insertMany(docs, { ordered: false });

    return res.status(201).json({
      message: "bulk_insert_success",
      inserted: docs.length,
    });

  } catch (err) {
    console.error("BULK FROM LINE INSERT ERROR:", err);

    if (err.code === 11000) {
      return res.status(200).json({
        message: "some_duplicates_skipped",
      });
    }

    return res.status(500).json({
      error: "internal_server_error",
    });
  }
};

export default [
  auth,
  checkPermission("offer.edit"),
  handler,
];