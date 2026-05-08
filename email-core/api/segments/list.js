import fs from "fs";
import path from "path";

const SEGMENT_DIR = "/var/www/email-core-data/segments";

export default function list(req, res) {
  try {
    if (!fs.existsSync(SEGMENT_DIR)) {
      return res.json([]);
    }

    const files = fs
      .readdirSync(SEGMENT_DIR)
      .filter((f) => f.endsWith(".txt"));

    const segments = files.map((file) => {
      const filePath = path.join(SEGMENT_DIR, file);
      const stats = fs.statSync(filePath);

      let count = 0;

      try {
        const content = fs.readFileSync(filePath, "utf8");
        count = content ? content.split("\n").length : 0;
      } catch {
        count = 0;
      }

      return {
        name: file.replace(".txt", ""),
        file,
        count,
        size: stats.size,
        created: stats.birthtime,
        download: `/api/segments/download?file=${file}`
      };
    });

    // newest first
    segments.sort((a, b) => new Date(b.created) - new Date(a.created));

    return res.json(segments);

  } catch (e) {
    console.error("SEGMENT LIST ERROR:", e);

    return res.status(500).json({
      error: "failed_to_list_segments"
    });
  }
}