import fs from "fs/promises";
import path from "path";
import axios from "axios";
import https from "https";
import normalizeEmail from "../utils/normalizeEmail.js";
import { PATHS } from "../config/paths.js";

const httpsAgent = new https.Agent({ family: 4 });

/* ======================
   CONSTANTS
====================== */
const MD5_REGEX = /^[a-f0-9]{32}$/;
const MAX_SIZE = 20 * 1024 * 1024; // 20MB

/* ======================
   SSRF SAFE URL CHECK
====================== */
function isSafeUrl(url) {
  try {
    const u = new URL(url);

    if (u.protocol !== "https:") return false;

    const forbidden = [
      "localhost",
      "127.0.0.1",
      "::1",
      "169.254.169.254",
    ];

    if (forbidden.includes(u.hostname)) return false;

    // block private IP ranges
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
   NORMALIZE GLOBAL BLOCK
   - Accepts email OR md5
====================== */
function normalizeGlobalBlock(content) {
  const set = new Set();

  for (const line of content.split(/\r?\n/)) {
    const raw = line.trim().toLowerCase();
    if (!raw) continue;

    // allow md5 directly
    if (MD5_REGEX.test(raw)) {
      set.add(raw);
      continue;
    }

    // allow email → md5
    const email = normalizeEmail(raw);
    if (email) {
      set.add(email);          // plain
      set.add(
        require("crypto")
          .createHash("md5")
          .update(email)
          .digest("hex")
      );
    }
  }

  return {
    content: Array.from(set).sort().join("\n") + "\n",
    count: set.size,
  };
}

/* ======================
   SYNC GLOBAL BLOCKLIST
====================== */
export default async function globalBlockSync(req, res) {
  try {
    /* ---------- INTERNAL AUTH ---------- */
    if (req.headers["x-internal-key"] !== process.env.INTERNAL_API_KEY) {
      return res.status(403).json({ error: "forbidden" });
    }

    const { fileUrl } = req.body;
    const file = req.file;

    if (!file && !fileUrl) {
      return res.status(400).json({
        error: "file_or_url_required",
      });
    }

    if (file && fileUrl) {
      return res.status(400).json({
        error: "choose_only_one_source",
      });
    }

    await fs.mkdir(PATHS.global, { recursive: true });

    const finalPath = path.join(PATHS.global, "global.txt");
    const tmpPath = finalPath + ".tmp";

    let raw = "";

    /* ---------- FILE UPLOAD ---------- */
    if (file) {
      if (file.size > MAX_SIZE) {
        return res.status(413).json({ error: "file_too_large" });
      }
      raw = file.buffer.toString("utf8");
    }

    /* ---------- URL FETCH ---------- */
    if (fileUrl) {
      if (!isSafeUrl(fileUrl)) {
        return res.status(400).json({ error: "unsafe_file_url" });
      }

      const r = await axios.get(fileUrl, {
        responseType: "text",
        timeout: 20000,
        maxContentLength: MAX_SIZE,
        httpsAgent,
      });

      raw = r.data;
    }

    /* ---------- NORMALIZE ---------- */
    const { content, count } = normalizeGlobalBlock(raw);

    if (!count) {
      return res.status(400).json({
        error: "empty_or_invalid_global_block",
      });
    }

    /* ---------- ATOMIC WRITE ---------- */
    await fs.writeFile(tmpPath, content, "utf8");
    await fs.rename(tmpPath, finalPath);

    return res.json({
      status: "success",
      count,
    });
  } catch (err) {
    console.error("GLOBAL BLOCK SYNC ERROR:", err);
    return res.status(500).json({
      error: "global_block_sync_failed",
      message: err.message,
    });
  }
}
