import mongoose from "mongoose";
import { updateSubjectLine } from "../../../services/subjectLineService.js";
import auth from "../../../middleware/auth.js";
import checkPermission from "../../../middleware/checkPermission.js";

const handler = async (req, res) => {
  try {
    const { id } = req.query;
    const { text, status } = req.body;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        error: "invalid_subject_id",
      });
    }

    if (text !== undefined && !String(text).trim()) {
      return res.status(400).json({
        error: "subject_text_empty",
      });
    }

    const updatePayload = {};

    if (text !== undefined) {
      updatePayload.text = String(text).trim();
    }

    if (status !== undefined) {
      updatePayload.status = status;
    }

    updatePayload.updatedBy = req.user.id;
    updatePayload.updatedAt = new Date();

    const updated = await updateSubjectLine(id, updatePayload);

    if (!updated) {
      return res.status(404).json({
        error: "subject_not_found",
      });
    }

    return res.json(updated);

  } catch (err) {
    console.error("UPDATE SUBJECT LINE ERROR:", err);
    return res.status(500).json({
      error: "subject_line_update_failed",
    });
  }
};

export default [
  auth,
  checkPermission("offer.edit"),
  handler,
];