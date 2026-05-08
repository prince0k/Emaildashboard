import { deleteCreative } from "../../../services/creativeService.js";
import Creative from "../../../models/Creative.js";
import auth from "../../../middleware/auth.js";
import checkPermission from "../../../middleware/checkPermission.js";

const handler = async (req, res) => {
  console.log("DELETE ROUTE HIT", {
    id: req.query.id,
    user: req.user,
  });
  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({
        error: "creative_id_required",
      });
    }

    const existing = await Creative.findById(id);

    if (!existing) {
      return res.status(404).json({
        error: "creative_not_found",
      });
    }

    // Ownership protection
    // if (
    //   req.user.role !== "super_admin" &&
    //   existing.createdBy?.toString() !== req.user.id
    // ) {
    //   return res.status(403).json({
    //     error: "not_owner",
    //   });
    // }

    // Recommended: Soft delete instead of hard delete
    existing.isDeleted = true;
    existing.deletedBy = req.user.mongoId;
    existing.deletedAt = new Date();
    await existing.save();

    // If you REALLY want hard delete:
    // await deleteCreative(id);

    return res.json({
      success: true,
      message: "creative_deleted",
    });

  } catch (err) {
    console.error("DELETE CREATIVE ERROR:", err);
    return res.status(500).json({
      error: "creative_delete_failed",
    });
  }
};

export default [
  auth,
  checkPermission("creative.delete"),
  handler,
];