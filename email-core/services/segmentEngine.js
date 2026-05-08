import fs from "fs";
import path from "path";

const SEGMENT_DIR = "/var/www/email-core-data/segments";
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function extractEmail(line) {
  if (!line) return null;

  const value = String(line).trim();
  if (!value) return null;

  const parts = value.split("|");
  const candidate = parts.length > 1 ? parts[1] : parts[0];
  const email = (candidate || "").trim().toLowerCase();

  if (!EMAIL_REGEX.test(email)) {
    return null;
  }

  return email;
}

/* ================================
LOAD SEGMENT FILE
================================ */

export function loadSegment(name) {
  const safe = path.basename(name);
  const filename = safe.endsWith(".txt") ? safe : `${safe}.txt`;

  const file = path.join(SEGMENT_DIR, filename);

  if (!fs.existsSync(file)) {
    throw new Error(`segment_not_found: ${filename}`);
  }

  const content = fs.readFileSync(file, "utf8");

  const emails = content
    .split(/\r?\n/)
    .map(extractEmail)
    .filter(Boolean);

  return [...new Set(emails)];
}

/* ================================
SAVE SEGMENT FILE
================================ */

export function saveSegment(name, emails) {
  if (!fs.existsSync(SEGMENT_DIR)) {
    fs.mkdirSync(SEGMENT_DIR, { recursive: true });
  }

  const safe = path.basename(name);

  const file = path.join(SEGMENT_DIR, `${safe}.txt`);

  const unique = [...new Set((emails || []).map(extractEmail).filter(Boolean))];

  fs.writeFileSync(file, unique.map(email => `warm|${email}||||||||||`).join("\n"));

  return {
    file,
    count: unique.length
  };
}

/* ================================
COMBINE SEGMENTS
================================ */

export function combineSegments(includeSegments, excludeSegments = []) {
  const includeSet = new Set();
  const excludeSet = new Set();

  includeSegments.forEach(seg => {
    const emails = loadSegment(seg);

    emails.forEach(e => includeSet.add(e));
  });

  excludeSegments.forEach(seg => {
    const emails = loadSegment(seg);

    emails.forEach(e => excludeSet.add(e));
  });

  const result = [];

  includeSet.forEach(email => {
    if (!excludeSet.has(email)) {
      result.push(email);
    }
  });

  return result;
}

/* ================================
SPLIT SEGMENT
================================ */

export function splitSegment(segmentName, parts) {
  const emails = loadSegment(segmentName);

  if (!parts || parts <= 1) {
    throw new Error("invalid_parts");
  }

  const size = Math.ceil(emails.length / parts);

  const files = [];

  for (let i = 0; i < parts; i++) {
    const start = i * size;
    const end = start + size;

    const chunk = emails.slice(start, end);

    if (!chunk.length) continue;

    const name = `${segmentName}_part${i + 1}`;

    const saved = saveSegment(name, chunk);

    files.push({
      name,
      count: saved.count
    });
  }

  return files;
}