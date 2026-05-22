import { spawn } from "child_process";
import path from "path";
import fs from "fs/promises";
import crypto from "crypto";

const SUPPRESSOR_BIN =
  process.env.SUPPRESSOR_BIN ||
  "/var/www/email-core/suppressor/target/release/suppressor";

function md5(str) {
  return crypto.createHash("md5").update(str).digest("hex");
}

/**
 * Pure JS Suppression Engine Fallback
 * Guaranteed to run successfully on any OS (including local dev environments like Windows/macOS)
 */
async function runSuppressionJS({
  inputPath,
  outputDir,
  md5Path,
  globalPath,
  unsubPath,
  complaintPath,
  bouncePath,
  domainComplaintPath,
  domainUnsubPath,
  skipUnsub,
  inclusionPaths,
  inclusionLimits,
  exclusionPaths,
  exclusionLimits,
  runId
}) {
  const readLines = async (p) => {
    if (!p) return new Set();
    try {
      const data = await fs.readFile(p, "utf8");
      return new Set(data.split(/\r?\n/).filter(Boolean).map(x => x.trim().toLowerCase()));
    } catch {
      return new Set();
    }
  };

  const md5Set = await readLines(md5Path);
  const globalSet = await readLines(globalPath);
  const complaintSet = await readLines(complaintPath);
  const unsubSet = skipUnsub ? new Set() : await readLines(unsubPath);
  const bounceSet = await readLines(bouncePath);

  // Domain-specific suppression files
  const domainComplaintSet = domainComplaintPath ? await readLines(domainComplaintPath) : new Set();
  const domainUnsubSet = (domainUnsubPath && !skipUnsub) ? await readLines(domainUnsubPath) : new Set();

  // Load inclusions and exclusions
  const loadSegmentEmails = async (segPath, limit = 0) => {
    try {
      const data = await fs.readFile(segPath, "utf8");
      const lines = data.split(/\r?\n/).filter(Boolean);
      const parsed = [];
      for (const line of lines) {
        const parts = line.split("|");
        const email = (parts[1] || parts[0] || "").trim().toLowerCase();
        if (email && email.includes("@")) {
          parsed.push(email);
        }
      }
      if (limit > 0) {
        return parsed.slice(0, limit);
      }
      return parsed;
    } catch {
      return [];
    }
  };

  // Build exclusion set
  const exclusionSet = new Set();
  for (let i = 0; i < exclusionPaths.length; i++) {
    const p = exclusionPaths[i];
    const lim = exclusionLimits[i] || 0;
    const emails = await loadSegmentEmails(p, lim);
    for (const e of emails) exclusionSet.add(e);
  }

  // Load inclusions
  const inclusionEmails = [];
  for (let i = 0; i < inclusionPaths.length; i++) {
    const p = inclusionPaths[i];
    const lim = inclusionLimits[i] || 0;
    const emails = await loadSegmentEmails(p, lim);
    for (const e of emails) inclusionEmails.push(e);
  }

  const seen = new Set();
  const outputEmails = [];
  const stats = {
    input: 0,
    invalid: 0,
    offer_md5: 0,
    global: 0,
    complaint: 0,
    unsubscribe: 0,
    bounce: 0,
    exclusion_removed: 0,
    duplicates: 0,
    inclusion_added: 0,
    kept: 0,
  };

  // RE-ENGINEERED PIPELINE: Build merged candidate pool
  const candidates = [];

  // Load campaign inputs
  const inputData = await fs.readFile(inputPath, "utf8");
  const inputLines = inputData.split(/\r?\n/).filter(Boolean);
  for (const line of inputLines) {
    const parts = line.split("|");
    const email = (parts[1] || "").trim().toLowerCase();
    if (!email || !email.includes("@")) {
      stats.invalid++;
      continue;
    }
    candidates.push({ email, is_inclusion: false });
  }

  // Merge inclusions
  for (const email of inclusionEmails) {
    candidates.push({ email, is_inclusion: true });
  }

  // Suppress all candidates
  for (const candidate of candidates) {
    if (!candidate.is_inclusion) {
      stats.input++;
    }

    const email = candidate.email;
    const h = md5(email);

    // 1. MD5
    if (md5Set.has(h)) { stats.offer_md5++; continue; }

    // 2. Global
    if (globalSet.has(email)) { stats.global++; continue; }

    // 3. Complaint (Global & Domain)
    if (complaintSet.has(email) || domainComplaintSet.has(email)) { stats.complaint++; continue; }

    // 4. Unsubscribe (Global & Domain)
    if (unsubSet.has(email) || domainUnsubSet.has(email)) { stats.unsubscribe++; continue; }

    // 5. Bounce
    if (bounceSet.has(email)) { stats.bounce++; continue; }

    // 6. Exclusion
    if (exclusionSet.has(email)) { stats.exclusion_removed++; continue; }

    // 7. Dedup
    if (seen.has(email)) { stats.duplicates++; continue; }

    seen.add(email);
    outputEmails.push(email);
    stats.kept++;

    if (candidate.is_inclusion) {
      stats.inclusion_added++;
    }
  }

  const outputFile = `final_${runId}.txt`;
  const statsFile = `stats_${runId}.json`;
  const outputPath = path.join(outputDir, outputFile);
  const statsPath = path.join(outputDir, statsFile);

  await fs.writeFile(outputPath, outputEmails.join("\n"));
  await fs.writeFile(statsPath, JSON.stringify(stats, null, 2));

  return {
    outputFile,
    outputPath,
    statsFile,
    statsPath,
    stats,
  };
}

/**
 * Run Rust suppressor v3 (domain-aware) with automatic Pure JS Fallback
 */
export default async function runSuppressionV2({
  inputPath,
  outputDir,
  md5Path,
  globalPath,
  unsubPath,
  complaintPath,
  bouncePath,
  /* ===== NEW v3 PARAMS ===== */
  domainComplaintPath = null,
  domainUnsubPath = null,
  skipUnsub = false,
  inclusionPaths = [],
  inclusionLimits = [],
  exclusionPaths = [],
  exclusionLimits = [],
}) {
  /* ---------- PRE-FLIGHT CHECKS (FAIL FAST) ---------- */
  const requiredFiles = {
    inputPath,
    md5Path,
    globalPath,
    unsubPath,
    complaintPath,
    bouncePath,
  };

  for (const [name, filePath] of Object.entries(requiredFiles)) {
    if (!filePath) {
      throw new Error(`Missing required path: ${name}`);
    }
    await fs.access(filePath).catch(() => {
      throw new Error(`File not found: ${filePath}`);
    });
  }

  /* ---------- UNIQUE RUN ID ---------- */
  const runId = `${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;

  const outputFile = `final_${runId}.txt`;
  const statsFile = `stats_${runId}.json`;

  const outputPath = path.join(outputDir, outputFile);
  const statsPath = path.join(outputDir, statsFile);

  /* ---------- ENSURE OUTPUT DIR ---------- */
  await fs.mkdir(outputDir, { recursive: true });

  /* ---------- BUILD ARGS ---------- */
  const args = [
    "--input", inputPath,
    "--output", outputPath,
    "--stats", statsPath,
    "--offer-md5", md5Path,
    "--global", globalPath,
    "--unsub", unsubPath,
    "--complaint", complaintPath,
    "--bounce", bouncePath,
  ];

  /* ===== DOMAIN-LEVEL FILES (optional) ===== */
  if (domainComplaintPath) {
    try {
      await fs.access(domainComplaintPath);
      args.push("--domain-complaint", domainComplaintPath);
    } catch {
      // Domain complaint file doesn't exist yet — skip
    }
  }

  if (domainUnsubPath) {
    try {
      await fs.access(domainUnsubPath);
      args.push("--domain-unsub", domainUnsubPath);
    } catch {
      // Domain unsub file doesn't exist yet — skip
    }
  }

  /* ===== SKIP UNSUB ===== */
  if (skipUnsub) {
    args.push("--skip-unsub");
  }

  /* ===== INCLUSION FILES ===== */
  for (let i = 0; i < inclusionPaths.length; i++) {
    const incPath = inclusionPaths[i];
    try {
      await fs.access(incPath);
      args.push("--inclusion", incPath);
      const limit = inclusionLimits[i] || 0;
      args.push("--inclusion-limit", String(limit));
    } catch {
      // Inclusion file not found — skip silently
    }
  }

  /* ===== EXCLUSION FILES ===== */
  for (let i = 0; i < exclusionPaths.length; i++) {
    const excPath = exclusionPaths[i];
    try {
      await fs.access(excPath);
      args.push("--exclusion", excPath);
      const limit = exclusionLimits[i] || 0;
      args.push("--exclusion-limit", String(limit));
    } catch {
      // Exclusion file not found — skip silently
    }
  }

  /* ---------- RUN RUST (WITH AUTOMATIC PURE JS FALLBACK) ---------- */
  try {
    await new Promise((resolve, reject) => {
      const proc = spawn(SUPPRESSOR_BIN, args, {
        stdio: ["ignore", "ignore", "pipe"],
      });

      let stderr = "";

      proc.stderr.on("data", d => {
        stderr += d.toString();
      });

      proc.on("error", err => {
        reject(new Error(`Failed to start suppressor: ${err.message}`));
      });

      proc.on("close", code => {
        if (code === 0) resolve();
        else reject(new Error(`Suppressor failed (${code}): ${stderr}`));
      });
    });

    /* ---------- READ STATS ---------- */
    const stats = JSON.parse(await fs.readFile(statsPath, "utf8"));

    return {
      outputFile,
      outputPath,
      statsFile,
      statsPath,
      stats,
    };
  } catch (err) {
    console.warn("⚠️ Suppressor binary execution failed, falling back to Pure JS Suppression Engine...");
    console.warn("Reason:", err.message);

    const fallbackResult = await runSuppressionJS({
      inputPath,
      outputDir,
      md5Path,
      globalPath,
      unsubPath,
      complaintPath,
      bouncePath,
      domainComplaintPath,
      domainUnsubPath,
      skipUnsub,
      inclusionPaths,
      inclusionLimits,
      exclusionPaths,
      exclusionLimits,
      runId
    });

    return fallbackResult;
  }
}
