import sanitizeHtml from "../../../utils/htmlSanitizer.js";
import { updateCreative } from "../../../services/creativeService.js";
import Creative from "../../../models/Creative.js";
import auth from "../../../middleware/auth.js";
import checkPermission from "../../../middleware/checkPermission.js";

const handler = async (req, res) => {
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

    // Optional ownership protection
    // if (
    //   req.user.role !== "super_admin" &&
    //   existing.createdBy?.toString() !== req.user.id
    // ) {
    //   return res.status(403).json({
    //     error: "not_owner",
    //   });
    // }

    const updateData = { ...req.body };

    if (updateData.html) {
      updateData.html = sanitizeHtml(updateData.html);
    }

    updateData.updatedBy = req.user.mongoId;
    updateData.updatedAt = new Date();
    
    const result = await updateCreative(id, updateData);

    return res.json(result);
  } catch (err) {
    console.error("UPDATE CREATIVE ERROR:", err);
    return res.status(500).json({
      error: "creative_update_failed",
    });
  }
};

export default [
  auth,
  checkPermission("creative.edit"),
  handler,
];