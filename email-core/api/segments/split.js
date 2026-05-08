import { splitSegment } from "../../services/segmentEngine.js";

export default async function split(req, res) {

  try {

    const {
      segment,
      parts
    } = req.body;

    if (!segment) {
      return res.status(400).json({
        error: "segment_required"
      });
    }

    if (!parts || parts < 2) {
      return res.status(400).json({
        error: "invalid_parts"
      });
    }

    const files = splitSegment(segment, parts);

    return res.json({
      message: "segment_split_success",
      files
    });

  } catch (err) {

    console.error("SEGMENT SPLIT ERROR:", err);

    return res.status(500).json({
      error: err.message || "segment_split_failed"
    });

  }

}