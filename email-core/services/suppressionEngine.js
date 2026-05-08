import { spawn } from "child_process";
import path from "path";
import fs from "fs/promises";
import crypto from "crypto";

const SUPPRESSOR_BIN =
  process.env.SUPPRESSOR_BIN ||
  "/var/www/email-core/suppressor/target/release/suppressor";

/**
 * Run Rust suppressor v2
 */
export default async function runSuppressionV2({
  inputPath,
  outputDir,
  md5Path,
  globalPath,
  unsubPath,
  complaintPath,
  bouncePath,
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

  /* ---------- RUN RUST ---------- */
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
}
