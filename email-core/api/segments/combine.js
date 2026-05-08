import { combineSegments, saveSegment } from "../../services/segmentEngine.js";

export default async function combine(req, res) {
  try {
    const { name, includeSegments, excludeSegments = [] } = req.body;

    if (!name) {
      return res.status(400).json({
        error: "segment_name_required"
      });
    }

    if (!Array.isArray(includeSegments) || includeSegments.length === 0) {
      return res.status(400).json({
        error: "include_segments_required"
      });
    }

    if (!Array.isArray(excludeSegments)) {
      return res.status(400).json({
        error: "exclude_segments_invalid"
      });
    }

    const emails = combineSegments(includeSegments, excludeSegments);
    const saved = saveSegment(name, emails);

    return res.json({
      segment: `${name}.txt`,
      count: saved.count
    });
  } catch (err) {
    console.error("SEGMENT COMBINE ERROR:", err);

    return res.status(500).json({
      error: err.message || "segment_combine_failed"
    });
  }
}