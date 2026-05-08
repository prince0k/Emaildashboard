import fs from "fs/promises";
import path from "path";
import axios from "axios";
import https from "https";
import normalizeEmail from "../utils/normalizeEmail.js";
import { PATHS } from "../config/paths.js";

const httpsAgent = new https.Agent({ family: 4 });
const MAX_SIZE = 20 * 1024 * 1024;

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
   NORMALIZE EMAIL FILE
====================== */
function normalizeEmailFile(content) {
  const set = new Set();

  for (const line of content.split(/\r?\n/)) {
    const email = normalizeEmail(line);
    if (email) set.add(email);
  }

  return {
    content: Array.from(set).sort().join("\n") + "\n",
    count: set.size,
  };
}

/* ======================
   SYNC SENDER UNSUB
====================== */
export default async function syncSenderUnsub(req, res) {
  try {
    /* ---------- INTERNAL AUTH ---------- */
    if (req.headers["x-internal-key"] !== process.env.INTERNAL_API_KEY) {
      return res.status(403).json({ error: "forbidden" });
    }

    const { fileUrl } = req.body;
    const file = req.file;

    if (!file && !fileUrl) {
      return res.status(400).json({ error: "file_or_url_required" });
    }

    if (file && fileUrl) {
      return res.status(400).json({ error: "choose_only_one_source" });
    }

    const finalPath = path.join(PATHS.unsub, "sender.txt");
    const tmpPath = finalPath + ".tmp";

    await fs.mkdir(PATHS.unsub, { recursive: true });

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
    const { content, count } = normalizeEmailFile(raw);

    if (!count) {
      return res.status(400).json({
        error: "empty_or_invalid_email_file",
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
    console.error("SENDER UNSUB SYNC ERROR:", err);
    return res.status(500).json({
      error: "sender_unsub_sync_failed",
      message: err.message,
    });
  }
}
