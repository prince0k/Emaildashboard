import crypto from "crypto";

/* =========================
   BASE64URL SAFE DECODE
========================= */
function base64UrlDecode(str) {
  str = String(str || "").trim();

  str = str.replace(/-/g, "+").replace(/_/g, "/");

  while (str.length % 4) {
    str += "=";
  }

  return Buffer.from(str, "base64");
}

/* =========================
   DECRYPT TOKEN
========================= */
export function decryptToken(token) {
  try {
    if (!token) return null;

    const keyStr = process.env.TRACKING_AES_KEY;
    if (!keyStr) {
      if (process.env.NODE_ENV === "production") {
        throw new Error("CRITICAL: TRACKING_AES_KEY env variable is required in production");
      }
    }
    const key = Buffer.from(
      keyStr || "9f3a8c7d6e5b4a3c2d1e0f9a8b7c6d5e",
      "utf-8"
    );

    const raw = base64UrlDecode(token);

    if (!raw || raw.length < 17) return null;

    const iv = raw.subarray(0, 16);
    const encrypted = raw.subarray(16);

    const decipher = crypto.createDecipheriv(
      "aes-256-cbc",
      key,
      iv
    );

    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return JSON.parse(decrypted.toString("utf-8"));

  } catch (e) {
  console.error("❌ DECRYPT FAIL:", e.message);
  console.error("❌ TOKEN LEN:", token?.length);
  console.error("❌ TOKEN SAMPLE:", token?.slice(0, 50));
  return null;
}
}

/* =========================
   OLD TOKEN CHECK
========================= */
export function isOldToken(token) {
  return /^[a-f0-9]{64}$/i.test(token);
}

/* =========================
   VALID TRACKING TOKEN
========================= */
export function isValidTrackingToken(token) {
  if (!token) return false;

  token = String(token).trim();

  // OLD
  if (/^[a-f0-9]{64}$/i.test(token)) return true;

  // NEW (strict base64url)
  if (token.length > 20 && /^[A-Za-z0-9\-_]+$/.test(token)) return true;

  return false;
}
/* =========================
   CLIENT META
========================= */
export function getClientMeta(req) {
  let ip =
    req.headers["cf-connecting-ip"] ||
    req.headers["x-forwarded-for"] ||
    req.socket?.remoteAddress ||
    null;

  if (ip && ip.includes(",")) {
    ip = ip.split(",")[0].trim();
  }

  const userAgent = req.headers["user-agent"] || "";

  const country =
    req.headers["cf-ipcountry"] ||
    req.headers["x-vercel-ip-country"] ||
    null;

  return { ip, userAgent, country };
}

/* =========================
   PACIFIC DAY STRING
========================= */
export function getPacificDayString(date = new Date()) {
  const options = {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  };

  const parts = new Intl.DateTimeFormat("en-CA", options).formatToParts(date);

  const year = parts.find(p => p.type === "year").value;
  const month = parts.find(p => p.type === "month").value;
  const day = parts.find(p => p.type === "day").value;

  return `${year}-${month}-${day}`;
}