import { updateFromLine } from "../../../services/fromLineService.js";
import FromLine from "../../../models/FromLine.js";
import auth from "../../../middleware/auth.js";
import checkPermission from "../../../middleware/checkPermission.js";

const handler = async (req, res) => {
  try {
    const { id } = req.query;
    const { text } = req.body;

    if (!id) {
      return res.status(400).json({
        error: "from_line_id_required",
      });
    }

    if (!text || !String(text).trim()) {
      return res.status(400).json({
        error: "text_required",
      });
    }

    const existing = await FromLine.findById(id);

    if (!existing) {
      return res.status(404).json({
        error: "from_line_not_found",
      });
    }

    // Ownership protection (optional but recommended)
    if (
      req.user.role !== "super_admin" &&
      existing.createdBy?.toString() !== req.user.id
    ) {
      return res.status(403).json({
        error: "not_owner",
      });
    }

    const updateData = {
      text: String(text).trim(),
      updatedBy: req.user.id,
      updatedAt: new Date(),
    };

    const result = await updateFromLine(id, updateData);

    return res.json(result);

  } catch (err) {
    console.error("UPDATE FROM LINE ERROR:", err);
    return res.status(500).json({
      error: "from_line_update_failed",
    });
  }
};

export default [
  auth,
  checkPermission("offer.edit"),
  handler,
];