import fs from "fs";
import path from "path";

const SEGMENT_DIR = "/var/www/email-core-data/segments";

export default function download(req, res) {
  try {
    const { name } = req.params;

    if (!name) {
      return res.status(400).json({
        error: "segment_name_required"
      });
    }

    /* =============================
       PREVENT PATH TRAVERSAL
    ============================== */

    const safeName = path.basename(name);

    if (!safeName.endsWith(".txt")) {
      return res.status(400).json({
        error: "invalid_segment_file"
      });
    }

    const filePath = path.join(SEGMENT_DIR, safeName);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        error: "segment_not_found"
      });
    }

    /* =============================
       DOWNLOAD
    ============================== */

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${safeName}"`
    );

    res.setHeader("Content-Type", "text/plain");

    const stream = fs.createReadStream(filePath);

    stream.pipe(res);

  } catch (err) {
    console.error("SEGMENT DOWNLOAD ERROR:", err);

    res.status(500).json({
      error: "segment_download_failed"
    });
  }
}