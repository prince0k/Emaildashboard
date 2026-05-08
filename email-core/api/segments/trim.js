import fs from "fs";
import path from "path";

const SEGMENT_DIR = "/var/www/email-core-data/segments";
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parseSegmentLine(line) {
  const parts = String(line || "").trim().split("|");
  const email = (parts[1] || parts[0] || "").trim().toLowerCase();

  if (!EMAIL_REGEX.test(email)) {
    return null;
  }

  const listId = (parts[2] || "").trim();

  return `warm|${email}|${listId}|||||||||`;
}

export default function trimSegment(req, res) {
  try {
    const { name, sourceSegment, removeHead = 0, removeTail = 0 } = req.body;

    if (!name) {
      return res.status(400).json({
        error: "segment_name_required"
      });
    }

    if (!sourceSegment) {
      return res.status(400).json({
        error: "source_segment_required"
      });
    }

    const filePath = path.join(SEGMENT_DIR, sourceSegment);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        error: "source_segment_not_found"
      });
    }

    const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/).filter(Boolean);

    let start = Number(removeHead) || 0;
    let end = lines.length - (Number(removeTail) || 0);

    if (start < 0) start = 0;
    if (end < start) end = start;

    const trimmed = lines
      .slice(start, end)
      .map(parseSegmentLine)
      .filter(Boolean);

    const newFile = path.join(SEGMENT_DIR, `${path.basename(name)}.txt`);

    fs.writeFileSync(newFile, trimmed.join("\n"));

    return res.json({
      segment: `${path.basename(name)}.txt`,
      count: trimmed.length
    });
  } catch (err) {
    console.error("SEGMENT TRIM ERROR:", err);

    return res.status(500).json({
      error: "segment_trim_failed"
    });
  }
}