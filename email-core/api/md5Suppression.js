import fs from "fs";
import path from "path";
import multer from "multer";
import fetch from "node-fetch";
import Offer from "../models/Offer.js";
import { fileURLToPath } from "url";

/* ======================
   PATH SETUP
====================== */
const TEMP_DIR = "/var/www/email-core-data/md5offeroptout";

if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

/* ======================
   MULTER (MEMORY)
====================== */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

/* ======================
   HANDLER
====================== */
async function handler(req, res) {
  try {
    const sid = String(req.body.sid || "").trim();

    if (!sid) {
      return res.status(400).json({ message: "sid is required" });
    }

    /* ======================
       LOAD OFFER
    ====================== */
    const offer = await Offer.findOne({
      sid,
      isActive: true,
      isDeleted: false,
    }).lean();

    if (!offer) {
      return res.status(404).json({
        message: "Offer not found or inactive",
      });
    }

    /* ======================
       FILE NAME
       sponsor_cid_offer.txt
    ====================== */
    const safe = (v) =>
      String(v || "")
        .toLowerCase()
        .replace(/[^a-z0-9_-]+/g, "_");

    const fileName = `${safe(offer.sponsor)}_${safe(
      offer.cid
    )}_${safe(offer.offer)}.txt`;

    const filePath = path.join(TEMP_DIR, fileName);

    /* ======================
       FILE FROM UPLOAD
    ====================== */
    if (req.file) {
      fs.writeFileSync(filePath, req.file.buffer);
    }

    /* ======================
       FILE FROM URL
    ====================== */
    else if (req.body.fileUrl) {
      const url = String(req.body.fileUrl).trim();

      if (!/^https?:\/\//i.test(url)) {
        return res.status(400).json({
          message: "Invalid fileUrl",
        });
      }

      const response = await fetch(url);
      if (!response.ok) {
        return res.status(400).json({
          message: "Failed to fetch remote file",
        });
      }

      const buffer = await response.buffer();
      fs.writeFileSync(filePath, buffer);
    }

    /* ======================
       NO FILE
    ====================== */
    else {
      return res.status(400).json({
        message: "File or fileUrl is required",
      });
    }

    return res.json({
      success: true,
      file: fileName,
      path: `/downloads/${fileName}`,
      size: fs.statSync(filePath).size,
    });
  } catch (err) {
    console.error("MD5 SUPPRESSION ERROR:", err);
    return res.status(500).json({
      message: "MD5 suppression sync failed",
    });
  }
}

/* ======================
   EXPORT (IMPORTANT)
====================== */
export default [
  upload.single("file"),
  async function md5Suppression(req, res) {
    res.json({ success: true });
  }
];

