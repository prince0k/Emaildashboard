import express from "express";
import path from "path";
import fs from "fs";

const router = express.Router();

const OUTPUT_DIR = "/var/www/email-core-data/output";

router.get("/output/:file", (req, res) => {
  const filePath = path.join(OUTPUT_DIR, req.params.file);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "file_not_found" });
  }

  res.download(filePath);
});

export default router;
