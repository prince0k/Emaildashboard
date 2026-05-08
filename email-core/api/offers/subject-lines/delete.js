import mongoose from "mongoose";
import SubjectLine from "../../../models/SubjectLine.js";
import auth from "../../../middleware/auth.js";
import checkPermission from "../../../middleware/checkPermission.js";

const handler = async (req, res) => {
  try {
    const { id } = req.query;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        error: "invalid_subject_id",
      });
    }

    const subject = await SubjectLine.findById(id);

    if (!subject || subject.isDeleted) {
      return res.status(404).json({
        error: "subject_not_found",
      });
    }

    subject.isDeleted = true;
    subject.deletedBy = req.user.id;
    subject.deletedAt = new Date();

    await subject.save();

    return res.json({
      success: true,
      message: "subject_deleted",
    });

  } catch (err) {
    console.error("DELETE SUBJECT LINE ERROR:", err);
    return res.status(500).json({
      error: "subject_line_delete_failed",
    });
  }
};

export default [
  auth,
  checkPermission("offer.edit"),
  handler,
];