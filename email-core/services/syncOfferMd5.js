import fs from "fs/promises";
import fsSync from "fs";
import path from "path";
import axios from "axios";
import https from "https";
import Offer from "../models/Offer.js";
import { PATHS } from "../config/paths.js";

const httpsAgent = new https.Agent({ family: 4 });

/* ======================
   CONSTANTS
====================== */
const MD5_REGEX = /^[a-f0-9]{32}$/;
const MAX_MD5_FILE_SIZE = 200 * 1024 * 1024; // 200MB (~6M MD5s)

/* ======================
   URL SAFETY
====================== */
function isSafeUrl(url) {
  try {
    const u = new URL(url);
    if (u.protocol !== "https:") return false;

    const forbiddenHosts = [
      "localhost",
      "127.0.0.1",
      "::1",
      "169.254.169.254",
    ];
    if (forbiddenHosts.includes(u.hostname)) return false;

    if (
      /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(u.hostname)
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/* ======================
   MD5 NORMALIZE + VALIDATE
====================== */
function normalizeMd5File(content) {
  const set = new Set();
  let invalid = 0;

  for (const line of content.split(/\r?\n/)) {
    const v = line.trim().toLowerCase();
    if (!v) continue;

    if (!MD5_REGEX.test(v)) {
      invalid++;
      continue;
    }
    set.add(v);
  }

  return {
    content: Array.from(set).sort().join("\n") + "\n",
    count: set.size,
    invalid,
  };
}

/* ======================
   SYNC OFFER MD5
====================== */
export default async function syncOfferMd5(req, res) {
  try {
    if (req.headers["x-internal-key"] !== process.env.INTERNAL_API_KEY) {
      return res.status(403).json({ error: "forbidden" });
    }

    const { sid, fileUrl } = req.body;
    const file = req.file;

    if (!sid) return res.status(400).json({ error: "sid_required" });
    if (!file && !fileUrl)
      return res.status(400).json({ error: "file_or_url_required" });
    if (file && fileUrl)
      return res.status(400).json({ error: "choose_only_one_source" });

    const offer = await Offer.findOne({
      sid: String(sid).trim(),
      isActive: true,
      isDeleted: false,
    }).lean();

    if (!offer) {
      return res.status(404).json({ error: "offer_not_found_or_inactive" });
    }

    if (!offer.md5FileName) {
      return res
        .status(500)
        .json({ error: "md5_filename_missing_in_offer" });
    }

    /* ----- PATHS (MUST MATCH RUST CALLER) ----- */
    const finalPath = path.join(PATHS.md5, offer.md5FileName);
    const tmpPath = finalPath + ".tmp";

    let rawContent = "";

    if (file) {
      if (file.size > MAX_MD5_FILE_SIZE) {
        return res.status(413).json({ error: "md5_file_too_large" });
      }
      rawContent = file.buffer.toString("utf8");
    }

    if (fileUrl) {
      if (!isSafeUrl(fileUrl)) {
        return res.status(400).json({ error: "unsafe_file_url" });
      }

      const response = await axios.get(fileUrl, {
        responseType: "text",
        timeout: 20000,
        httpsAgent,
        maxContentLength: MAX_MD5_FILE_SIZE,
      });

      rawContent = response.data;
    }

    const { content, count, invalid } = normalizeMd5File(rawContent);

    if (!count) {
      return res.status(400).json({ error: "empty_or_invalid_md5_file" });
    }

    if (invalid > 0) {
      return res.status(400).json({
        error: "invalid_md5_lines_detected",
        invalid,
      });
    }

    /* ----- ATOMIC + DURABLE WRITE ----- */
    await fs.writeFile(tmpPath, content, "utf8");

    const fd = fsSync.openSync(tmpPath, "r");
    fsSync.fsyncSync(fd);
    fsSync.closeSync(fd);

    await fs.rename(tmpPath, finalPath);

    return res.json({
      status: "success",
      sid: offer.sid,
      file: offer.md5FileName,
      count,
    });
  } catch (err) {
    console.error("MD5 SYNC ERROR:", err);
    return res.status(500).json({
      error: "md5_sync_failed",
      message: err.message,
    });
  }
}
