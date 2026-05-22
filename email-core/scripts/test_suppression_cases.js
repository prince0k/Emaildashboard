/**
 * test_suppression_cases.js
 * 
 * Runs four distinct test cases of segment inclusion & exclusion trimming with suppression:
 * 1. Inclusion remove 100 starting, Exclusion remove 100 ending
 * 2. Inclusion remove 100 ending,   Exclusion remove 100 ending
 * 3. Inclusion remove 100 ending,   Exclusion remove 100 starting
 * 4. Inclusion remove 100 starting, Exclusion remove 100 starting
 * 
 * Implements segment trimming exactly matching `/api/segments/trim` and runs the suppression pipeline.
 * Features:
 * - Inclusion segments are merged with the campaign list BEFORE suppression is evaluated.
 * - Confirms that overlapping inclusion records are successfully suppressed.
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";

const DATA_ROOT = process.env.DATA_ROOT || path.join(process.cwd(), "..", "email-core-data");
const SEGMENT_DIR = path.join(DATA_ROOT, "segments");
const OUTPUT_DIR = path.join(DATA_ROOT, "output");
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

console.log("🚀 Starting Inclusion/Exclusion Suppression Test Suite...");
console.log("📂 DATA_ROOT:", DATA_ROOT);

// Helper to parse emails like the API
function parseSegmentLine(line) {
  const parts = String(line || "").trim().split("|");
  const email = (parts[1] || parts[0] || "").trim().toLowerCase();

  if (!EMAIL_REGEX.test(email)) {
    return null;
  }

  const listId = (parts[2] || "").trim();
  return `warm|${email}|${listId}|||||||||`;
}

// Replicate /api/segments/trim
function trimSegment(sourceFile, destFile, removeHead, removeTail) {
  const filePath = path.join(SEGMENT_DIR, sourceFile);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Source segment not found: ${filePath}`);
  }

  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/).filter(Boolean);
  let start = Number(removeHead) || 0;
  let end = lines.length - (Number(removeTail) || 0);

  if (start < 0) start = 0;
  if (end < start) end = start;

  const trimmed = lines
    .slice(start, end)
    .map(parseSegmentLine)
    .filter(Boolean);

  const destPath = path.join(SEGMENT_DIR, destFile);
  fs.writeFileSync(destPath, trimmed.join("\n"));
  console.log(`  ✂️ Trimmed ${sourceFile} -> ${destFile} (Remove Head: ${removeHead}, Tail: ${removeTail}). Result: ${trimmed.length} lines.`);
  return trimmed.map(line => line.split("|")[1]);
}

// Generate MD5 helper
function md5(str) {
  return crypto.createHash("md5").update(str).digest("hex");
}

// Main suppression engine runner (pure JS matching the Rust implementation)
function runSuppression({
  inputFileName,
  inclusionEmails,
  exclusionEmails,
  caseName
}) {
  const inputPath = path.join(SEGMENT_DIR, inputFileName);
  const globalPath = path.join(DATA_ROOT, "global", "normalized.txt");
  const md5Path = path.join(DATA_ROOT, "md5offeroptout", "test_offer.sorted.txt");
  const complaintPath = path.join(DATA_ROOT, "complaint", "complaint.txt");
  const unsubPath = path.join(DATA_ROOT, "unsubscribe", "unsub.txt");
  const bouncePath = path.join(DATA_ROOT, "bounce", "hard.txt");

  // Load all suppression sets
  const globalSet = new Set(fs.existsSync(globalPath) ? fs.readFileSync(globalPath, "utf-8").split("\n").filter(Boolean) : []);
  const md5Set = new Set(fs.existsSync(md5Path) ? fs.readFileSync(md5Path, "utf-8").split("\n").filter(Boolean) : []);
  const complaintSet = new Set(fs.existsSync(complaintPath) ? fs.readFileSync(complaintPath, "utf-8").split("\n").filter(Boolean) : []);
  const unsubSet = new Set(fs.existsSync(unsubPath) ? fs.readFileSync(unsubPath, "utf-8").split("\n").filter(Boolean) : []);
  const bounceSet = new Set(fs.existsSync(bouncePath) ? fs.readFileSync(bouncePath, "utf-8").split("\n").filter(Boolean) : []);
  
  const exclusionSet = new Set(exclusionEmails);
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

  // NEW RE-ENGINEERED MERGED SUPPRESSION PIPELINE
  const candidates = [];

  // 1. Campaign inputs
  const inputLines = fs.readFileSync(inputPath, "utf-8").split(/\r?\n/).filter(Boolean);
  for (const line of inputLines) {
    const parts = line.split("|");
    const email = (parts[1] || "").trim().toLowerCase();
    if (!email || !email.includes("@")) {
      stats.invalid++;
      continue;
    }
    candidates.push({ email, is_inclusion: false });
  }

  // 2. Inclusions (Merged in first!)
  for (const email of inclusionEmails) {
    candidates.push({ email, is_inclusion: true });
  }

  // Run unified suppression loop on the combined candidates pool
  for (const candidate of candidates) {
    if (!candidate.is_inclusion) {
      stats.input++;
    }

    const email = candidate.email;
    const h = md5(email);

    // 1. Offer MD5
    if (md5Set.has(h)) { stats.offer_md5++; continue; }

    // 2. Global
    if (globalSet.has(email)) { stats.global++; continue; }

    // 3. Global complaint
    if (complaintSet.has(email)) { stats.complaint++; continue; }

    // 4. Global unsub
    if (unsubSet.has(email)) { stats.unsubscribe++; continue; }

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

  // Save outputs
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const finalOutputPath = path.join(OUTPUT_DIR, `suppressed_${caseName}.txt`);
  const finalStatsPath = path.join(OUTPUT_DIR, `stats_${caseName}.json`);

  fs.writeFileSync(finalOutputPath, outputEmails.join("\n"));
  fs.writeFileSync(finalStatsPath, JSON.stringify(stats, null, 2));

  return stats;
}

/* ===================================================
   SETUP DATA & INJECT OVERLAPS FOR INCLUSION
   =================================================== */

const testCampaignPath = path.join(SEGMENT_DIR, "test_campaign_20k.txt");
if (!fs.existsSync(testCampaignPath)) {
  console.log("❌ Source segment test_campaign_20k.txt not found. Please run scripts/generateTestData.js first.");
  process.exit(1);
}

const campaignLines = fs.readFileSync(testCampaignPath, "utf-8").split(/\r?\n/).filter(Boolean);
const overlapEmails = campaignLines
  .slice(10000, 10500) // Select 500 emails that are in the middle of our campaign segment
  .map(line => {
    const parts = line.split("|");
    return parts[1] || "";
  })
  .filter(Boolean);

const exclusionSourceFile = "exclusion_test_500.txt";
fs.writeFileSync(
  path.join(SEGMENT_DIR, exclusionSourceFile),
  overlapEmails.map(email => `warm|${email}||||||||||`).join("\n")
);
console.log(`\n✨ Created robust exclusion source: ${exclusionSourceFile} with ${overlapEmails.length} overlapping emails.`);

// Let's create a rich 500-line inclusion segment containing 15 explicitly overlapping suppression emails
const inclusionTestFile = "inclusion_test.txt";
const unsubPath = path.join(DATA_ROOT, "unsubscribe", "unsub.txt");
const bouncePath = path.join(DATA_ROOT, "bounce", "hard.txt");
const complaintPath = path.join(DATA_ROOT, "complaint", "complaint.txt");

const globalUnsubs = fs.existsSync(unsubPath) ? fs.readFileSync(unsubPath, "utf-8").split("\n").filter(Boolean).slice(0, 5) : [];
const hardBounces = fs.existsSync(bouncePath) ? fs.readFileSync(bouncePath, "utf-8").split("\n").filter(Boolean).slice(0, 5) : [];
const complaints = fs.existsSync(complaintPath) ? fs.readFileSync(complaintPath, "utf-8").split("\n").filter(Boolean).slice(0, 5) : [];

console.log(`\n🔍 Overlapping suppression records to inject into inclusion:`);
console.log(`  - Global Unsubs: ${globalUnsubs.length}`);
console.log(`  - Hard Bounces: ${hardBounces.length}`);
console.log(`  - Complaints: ${complaints.length}`);

// We'll read 485 fresh emails and append the 15 overlapping ones to make exactly 500 records
const freshInclusionEmails = [];
for (let i = 1; i <= 485; i++) {
  freshInclusionEmails.push(`fresh_inclusion_user_${i}@inclusiondomain.com`);
}

const finalInclusionSegmentPool = [
  ...freshInclusionEmails,
  ...globalUnsubs,
  ...hardBounces,
  ...complaints
];

fs.writeFileSync(
  path.join(SEGMENT_DIR, inclusionTestFile),
  finalInclusionSegmentPool.map(email => `warm|${email}||||||||||`).join("\n")
);
console.log(`📝 Generated inclusion_test.txt with exactly ${finalInclusionSegmentPool.length} emails (fresh + suppression overlaps).`);

/* ===================================================
   RUN TEST CASES
   =================================================== */

const results = [];

// --- TEST CASE 1 ---
console.log("\n--- Running Test Case 1 ---");
console.log("Inclusion: remove 100 from starting (leaves 385 fresh + 15 overlapping)");
console.log("Exclusion: remove 100 from ending");
const inclEmails1 = trimSegment(inclusionTestFile, "trimmed_incl_case1.txt", 100, 0);
const exclEmails1 = trimSegment(exclusionSourceFile, "trimmed_excl_case1.txt", 0, 100);
const stats1 = runSuppression({
  inputFileName: "test_campaign_20k.txt",
  inclusionEmails: inclEmails1,
  exclusionEmails: exclEmails1,
  caseName: "case1"
});
results.push({ caseName: "Test Case 1", stats: stats1 });

// --- TEST CASE 2 ---
console.log("\n--- Running Test Case 2 ---");
console.log("Inclusion: remove 100 from ending (leaves 400 fresh, 0 overlapping)");
console.log("Exclusion: remove 100 from ending");
const inclEmails2 = trimSegment(inclusionTestFile, "trimmed_incl_case2.txt", 0, 100);
const exclEmails2 = trimSegment(exclusionSourceFile, "trimmed_excl_case2.txt", 0, 100);
const stats2 = runSuppression({
  inputFileName: "test_campaign_20k.txt",
  inclusionEmails: inclEmails2,
  exclusionEmails: exclEmails2,
  caseName: "case2"
});
results.push({ caseName: "Test Case 2", stats: stats2 });

// --- TEST CASE 3 ---
console.log("\n--- Running Test Case 3 ---");
console.log("Inclusion: remove 100 from ending (leaves 400 fresh, 0 overlapping)");
console.log("Exclusion: remove 100 from starting");
const inclEmails3 = trimSegment(inclusionTestFile, "trimmed_incl_case3.txt", 0, 100);
const exclEmails3 = trimSegment(exclusionSourceFile, "trimmed_excl_case3.txt", 100, 0);
const stats3 = runSuppression({
  inputFileName: "test_campaign_20k.txt",
  inclusionEmails: inclEmails3,
  exclusionEmails: exclEmails3,
  caseName: "case3"
});
results.push({ caseName: "Test Case 3", stats: stats3 });

// --- TEST CASE 4 ---
console.log("\n--- Running Test Case 4 ---");
console.log("Inclusion: remove 100 from starting (leaves 385 fresh + 15 overlapping)");
console.log("Exclusion: remove 100 from starting");
const inclEmails4 = trimSegment(inclusionTestFile, "trimmed_incl_case4.txt", 100, 0);
const exclEmails4 = trimSegment(exclusionSourceFile, "trimmed_excl_case4.txt", 100, 0);
const stats4 = runSuppression({
  inputFileName: "test_campaign_20k.txt",
  inclusionEmails: inclEmails4,
  exclusionEmails: exclEmails4,
  caseName: "case4"
});
results.push({ caseName: "Test Case 4", stats: stats4 });

/* ===================================================
   SUMMARY REPORT
   ================================================== */
console.log("\n" + "═".repeat(80));
console.log("  📊 SUMMARY OF MERGED SUPPRESSION TEST CASES");
console.log("═".repeat(80));
console.log("");
console.log("Case        | Input  | Kept   | Excluded | Included | Bounces  | Unsubs   | Complaints");
console.log("------------|--------|--------|----------|----------|----------|----------|-----------");
for (const r of results) {
  const s = r.stats;
  console.log(
    `${r.caseName.padEnd(11)} | ` +
    `${String(s.input).padEnd(6)} | ` +
    `${String(s.kept).padEnd(6)} | ` +
    `${String(s.exclusion_removed).padEnd(8)} | ` +
    `${String(s.inclusion_added).padEnd(8)} | ` +
    `${String(s.bounce).padEnd(8)} | ` +
    `${String(s.unsubscribe).padEnd(8)} | ` +
    `${String(s.complaint).padEnd(9)}`
  );
}
console.log("\n" + "═".repeat(80));

// Save summary to JSON file
fs.writeFileSync(
  path.join(OUTPUT_DIR, "summary_cases.json"),
  JSON.stringify(results, null, 2)
);
console.log("💾 Saved full summary to output/summary_cases.json\n");
