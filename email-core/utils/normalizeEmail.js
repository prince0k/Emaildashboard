/*
  EMAIL NORMALIZER — SEGMENT V2 SAFE
  =================================
  Supports:
  - raw email lines
  - pipe-delimited segment lines
    warm|email.com|provider|fname|lname|||||||
*/

export default function normalizeEmail(input) {
  if (typeof input !== "string") return null;

  let raw = input.trim();
  if (!raw) return null;

  // NEW: handle pipe-delimited format
  if (raw.includes("|")) {
    const parts = raw.split("|");

    // email must be 2nd column
    if (parts.length < 2) return null;

    raw = parts[1].trim();
    if (!raw) return null;
  }

  const s = raw.toLowerCase();

  const at = s.indexOf("@");
  if (at === -1) return null;
  if (at === 0) return null;
  if (at + 1 >= s.length) return null;

  // Must match Rust logic: domain must contain dot
  if (!s.slice(at + 1).includes(".")) return null;

  return s;
}
