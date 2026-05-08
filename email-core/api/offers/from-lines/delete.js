import { deleteFromLine } from "../../../services/fromLineService.js";
import FromLine from "../../../models/FromLine.js";
import auth from "../../../middleware/auth.js";
import checkPermission from "../../../middleware/checkPermission.js";

const handler = async (req, res) => {
  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({
        error: "from_line_id_required",
      });
    }

    const existing = await FromLine.findById(id);

    if (!existing) {
      return res.status(404).json({
        error: "from_line_not_found",
      });
    }

    // Ownership protection
    if (
      req.user.role !== "super_admin" &&
      existing.createdBy?.toString() !== req.user.id
    ) {
      return res.status(403).json({
        error: "not_owner",
      });
    }

    // Recommended: Soft delete
    existing.isDeleted = true;
    existing.deletedBy = req.user.id;
    existing.deletedAt = new Date();
    await existing.save();

    // If you really want hard delete:
    // await deleteFromLine(id);

    return res.json({
      success: true,
      message: "from_line_deleted",
    });

  } catch (err) {
    console.error("DELETE FROM LINE ERROR:", err);
    return res.status(500).json({
      error: "from_line_delete_failed",
    });
  }
};

export default [
  auth,
  checkPermission("offer.edit"),
  handler,
];