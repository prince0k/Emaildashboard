import sanitizeHtml from "../../../utils/htmlSanitizer.js";
import { createCreative } from "../../../services/creativeService.js";
import auth from "../../../middleware/auth.js";
import checkPermission from "../../../middleware/checkPermission.js";

const handler = async (req, res) => {
  try {
    const data = req.body;

    if (!data?.offerId || !data?.html) {
      return res.status(400).json({
        error: "missing_required_fields",
      });
    }

    // Sanitize HTML
    data.html = sanitizeHtml(data.html);

    // Audit field
    data.createdBy = req.user.mongoId;

    const result = await createCreative(data);

    return res.status(201).json(result);
  } catch (err) {
    console.error("CREATE CREATIVE ERROR:", err);
    return res.status(500).json({
      error: "creative_creation_failed",
    });
  }
};

export default [
  auth,
  checkPermission("creative.create"),
  handler,
];