import { createFromLine } from "../../../services/fromLineService.js";
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

    const data = {
      offerId,
      text: String(text).trim(),
      createdBy: req.user.id,
      createdAt: new Date(),
    };

    const result = await createFromLine(data);

    return res.status(201).json(result);

  } catch (err) {
    console.error("CREATE FROM LINE ERROR:", err);
    return res.status(500).json({
      error: "from_line_creation_failed",
    });
  }
};

export default [
  auth,
  checkPermission("offer.edit"),
  handler,
];