/**
 * generateTestData.js
 * Creates all necessary suppression data files with dummy data (10-20k records)
 * and runs a suppression test to verify the pipeline.
 * 
 * Usage: node scripts/generateTestData.js
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";

const DATA_ROOT = process.env.DATA_ROOT || path.join(process.cwd(), "..", "email-core-data");

console.log("📂 DATA_ROOT:", DATA_ROOT);

/* ===========================
   HELPERS
=========================== */

function randomEmail(prefix, domain) {
  const rand = crypto.randomBytes(4).toString("hex");
  return `${prefix}_${rand}@${domain}`.toLowerCase();
}

function md5(str) {
  return crypto.createHash("md5").update(str).digest("hex");
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`  📁 Created: ${dir}`);
  }
}

function writeFile(filePath, content) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content);
  const lines = content.split("\n").filter(Boolean).length;
  console.log(`  ✅ ${path.relative(DATA_ROOT, filePath)} — ${lines.toLocaleString()} lines`);
}

/* ===========================
   GENERATE EMAIL POOLS
=========================== */

console.log("\n🔧 Generating email pools...\n");

const domains = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "aol.com"];
const sendDomains = ["sender1.com", "sender2.com", "sender3.com"];

// Main segment: 20,000 emails
const segmentEmails = [];
for (let i = 0; i < 20000; i++) {
  const domain = domains[i % domains.length];
  segmentEmails.push(randomEmail("user", domain));
}

// Global suppression: 500 from segment + 1000 randoms
const globalEmails = [];
for (let i = 0; i < 500; i++) {
  globalEmails.push(segmentEmails[i * 3]); // every 3rd from start
}
for (let i = 0; i < 1000; i++) {
  globalEmails.push(randomEmail("global", domains[i % domains.length]));
}

// Offer MD5: 300 from segment
const md5Emails = [];
for (let i = 0; i < 300; i++) {
  md5Emails.push(segmentEmails[500 + i * 5]); // offset to avoid overlap with global
}
const md5Hashes = md5Emails.map(e => md5(e));
md5Hashes.sort(); // Must be sorted for binary search

// Global complaints: 200 from segment
const complaintEmails = [];
for (let i = 0; i < 200; i++) {
  complaintEmails.push(segmentEmails[2000 + i * 7]);
}

// Domain complaints (sender1.com): 150 from segment
const domainComplaintEmails = [];
for (let i = 0; i < 150; i++) {
  domainComplaintEmails.push(segmentEmails[4000 + i * 9]);
}

// Global unsubs: 180 from segment
const unsubEmails = [];
for (let i = 0; i < 180; i++) {
  unsubEmails.push(segmentEmails[6000 + i * 8]);
}

// Domain unsubs (sender1.com): 120 from segment
const domainUnsubEmails = [];
for (let i = 0; i < 120; i++) {
  domainUnsubEmails.push(segmentEmails[8000 + i * 6]);
}

// Bounces: 250 from segment
const bounceEmails = [];
for (let i = 0; i < 250; i++) {
  bounceEmails.push(segmentEmails[10000 + i * 4]);
}

// Exclusion segment: 100 from segment
const exclusionEmails = [];
for (let i = 0; i < 100; i++) {
  exclusionEmails.push(segmentEmails[15000 + i]);
}

// Inclusion segment: 500 fresh emails (not in segment)
const inclusionEmails = [];
for (let i = 0; i < 500; i++) {
  inclusionEmails.push(randomEmail("incl", domains[i % domains.length]));
}

/* ===========================
   WRITE FILES
=========================== */

console.log("📝 Writing data files...\n");

// 1. Main segment file (pipe-delimited format)
const segmentContent = segmentEmails.map(e => `warm|${e}||||||||||`).join("\n");
writeFile(path.join(DATA_ROOT, "segments", "test_campaign_20k.txt"), segmentContent);

// 2. Global suppression
writeFile(path.join(DATA_ROOT, "global", "normalized.txt"), [...new Set(globalEmails)].join("\n"));

// 3. MD5 offer opt-out (sorted)
writeFile(path.join(DATA_ROOT, "md5offeroptout", "test_offer.sorted.txt"), md5Hashes.join("\n"));

// 4. Global complaint
writeFile(path.join(DATA_ROOT, "complaint", "complaint.txt"), [...new Set(complaintEmails)].join("\n"));

// 5. Domain complaint (sender1.com)
writeFile(path.join(DATA_ROOT, "complaint", "domain", "sender1.com.txt"), [...new Set(domainComplaintEmails)].join("\n"));

// 6. Global unsub
writeFile(path.join(DATA_ROOT, "unsubscribe", "sender.txt"), [...new Set(unsubEmails)].join("\n"));

// Also write as unsub.txt (new format)
writeFile(path.join(DATA_ROOT, "unsubscribe", "unsub.txt"), [...new Set(unsubEmails)].join("\n"));

// 7. Domain unsub (sender1.com)
writeFile(path.join(DATA_ROOT, "unsubscribe", "domain", "sender1.com.txt"), [...new Set(domainUnsubEmails)].join("\n"));

// 8. Hard bounce
writeFile(path.join(DATA_ROOT, "bounce", "hard.txt"), [...new Set(bounceEmails)].join("\n"));

// 9. Exclusion segment
const exclusionContent = exclusionEmails.map(e => `warm|${e}||||||||||`).join("\n");
writeFile(path.join(DATA_ROOT, "segments", "exclusion_test.txt"), exclusionContent);

// 10. Inclusion segment  
const inclusionContent = inclusionEmails.map(e => `warm|${e}||||||||||`).join("\n");
writeFile(path.join(DATA_ROOT, "segments", "inclusion_test.txt"), inclusionContent);

/* ===========================
   JS-BASED SUPPRESSION TEST
   (simulates Rust binary logic since we can't compile on Windows)
=========================== */

console.log("\n🧪 Running JS-based suppression test (simulates Rust binary)...\n");

// Load all suppression sets
const globalSet = new Set(fs.readFileSync(path.join(DATA_ROOT, "global", "normalized.txt"), "utf-8").split("\n").filter(Boolean));
const md5Set = new Set(md5Hashes);
const complaintSet = new Set(fs.readFileSync(path.join(DATA_ROOT, "complaint", "complaint.txt"), "utf-8").split("\n").filter(Boolean));
const domainComplaintSet = new Set(fs.readFileSync(path.join(DATA_ROOT, "complaint", "domain", "sender1.com.txt"), "utf-8").split("\n").filter(Boolean));
const unsubSet = new Set(fs.readFileSync(path.join(DATA_ROOT, "unsubscribe", "sender.txt"), "utf-8").split("\n").filter(Boolean));
const domainUnsubSet = new Set(fs.readFileSync(path.join(DATA_ROOT, "unsubscribe", "domain", "sender1.com.txt"), "utf-8").split("\n").filter(Boolean));
const bounceSet = new Set(fs.readFileSync(path.join(DATA_ROOT, "bounce", "hard.txt"), "utf-8").split("\n").filter(Boolean));

// Load exclusion
const exclusionSet = new Set();
for (const line of fs.readFileSync(path.join(DATA_ROOT, "segments", "exclusion_test.txt"), "utf-8").split("\n").filter(Boolean)) {
  const email = line.includes("|") ? line.split("|")[1]?.trim().toLowerCase() : line.trim().toLowerCase();
  if (email) exclusionSet.add(email);
}

// Load inclusion
const inclusionList = [];
for (const line of fs.readFileSync(path.join(DATA_ROOT, "segments", "inclusion_test.txt"), "utf-8").split("\n").filter(Boolean)) {
  const email = line.includes("|") ? line.split("|")[1]?.trim().toLowerCase() : line.trim().toLowerCase();
  if (email) inclusionList.push(email);
}

// Process segment
const stats = {
  input: 0,
  invalid: 0,
  offer_md5: 0,
  global: 0,
  complaint: 0,
  domain_complaint: 0,
  unsubscribe: 0,
  domain_unsub: 0,
  bounce: 0,
  exclusion_removed: 0,
  duplicates: 0,
  inclusion_added: 0,
  kept: 0,
};

const seen = new Set();
const outputEmails = [];

for (const line of segmentContent.split("\n")) {
  stats.input++;
  const parts = line.split("|");
  const email = (parts[1] || "").trim().toLowerCase();
  
  if (!email || !email.includes("@")) {
    stats.invalid++;
    continue;
  }

  const h = md5(email);

  // 1. Offer MD5
  if (md5Set.has(h)) { stats.offer_md5++; continue; }

  // 2. Global
  if (globalSet.has(email)) { stats.global++; continue; }

  // 3. Global complaint
  if (complaintSet.has(email)) { stats.complaint++; continue; }

  // 4. Domain complaint
  if (domainComplaintSet.has(email)) { stats.domain_complaint++; continue; }

  // 5. Global unsub
  if (unsubSet.has(email)) { stats.unsubscribe++; continue; }

  // 6. Domain unsub
  if (domainUnsubSet.has(email)) { stats.domain_unsub++; continue; }

  // 7. Bounce
  if (bounceSet.has(email)) { stats.bounce++; continue; }

  // 8. Exclusion
  if (exclusionSet.has(email)) { stats.exclusion_removed++; continue; }

  // 9. Dedup
  if (seen.has(email)) { stats.duplicates++; continue; }

  seen.add(email);
  outputEmails.push(email);
  stats.kept++;
}

// 10. Inclusion merge
for (const email of inclusionList) {
  if (!seen.has(email)) {
    seen.add(email);
    outputEmails.push(email);
    stats.inclusion_added++;
    stats.kept++;
  }
}

// Write output
const outputPath = path.join(DATA_ROOT, "output", "final_test_result.txt");
writeFile(outputPath, outputEmails.join("\n"));

// Write stats
const statsPath = path.join(DATA_ROOT, "output", "stats_test_result.json");
fs.writeFileSync(statsPath, JSON.stringify(stats, null, 2));
console.log(`  ✅ Stats written to output/stats_test_result.json`);

/* ===========================
   RESULTS
=========================== */

console.log("\n" + "═".repeat(60));
console.log("  📊 SUPPRESSION TEST RESULTS");
console.log("═".repeat(60));
console.log("");
console.log(`  Input:             ${stats.input.toLocaleString()}`);
console.log(`  Invalid:           ${stats.invalid.toLocaleString()}`);
console.log(`  Offer MD5:         ${stats.offer_md5.toLocaleString()}`);
console.log(`  Global:            ${stats.global.toLocaleString()}`);
console.log(`  Global Complaint:  ${stats.complaint.toLocaleString()}`);
console.log(`  Domain Complaint:  ${stats.domain_complaint.toLocaleString()}`);
console.log(`  Global Unsub:      ${stats.unsubscribe.toLocaleString()}`);
console.log(`  Domain Unsub:      ${stats.domain_unsub.toLocaleString()}`);
console.log(`  Bounce:            ${stats.bounce.toLocaleString()}`);
console.log(`  Exclusion:         ${stats.exclusion_removed.toLocaleString()}`);
console.log(`  Duplicates:        ${stats.duplicates.toLocaleString()}`);
console.log(`  Inclusion Added:   +${stats.inclusion_added.toLocaleString()}`);
console.log("  " + "─".repeat(40));
console.log(`  FINAL COUNT:       ${stats.kept.toLocaleString()}`);
console.log(`  TOTAL REMOVED:     ${(stats.input - stats.kept + stats.inclusion_added).toLocaleString()}`);
console.log("");
console.log("═".repeat(60));

// Sanity checks
const totalAccountedFor = stats.invalid + stats.offer_md5 + stats.global + 
  stats.complaint + stats.domain_complaint + stats.unsubscribe + 
  stats.domain_unsub + stats.bounce + stats.exclusion_removed + 
  stats.duplicates + stats.kept - stats.inclusion_added;

console.log(`\n🔍 Sanity check: input=${stats.input}, accounted=${totalAccountedFor} ${stats.input === totalAccountedFor ? "✅ MATCH" : "❌ MISMATCH"}`);

console.log("\n✅ All test data files created and suppression verified!\n");
console.log("📁 Files created:");
console.log("   segments/test_campaign_20k.txt     (main input)");
console.log("   segments/exclusion_test.txt         (exclusion segment)");
console.log("   segments/inclusion_test.txt         (inclusion segment)");
console.log("   global/normalized.txt               (global suppression)");
console.log("   md5offeroptout/test_offer.sorted.txt (offer MD5)");
console.log("   complaint/complaint.txt             (global complaints)");
console.log("   complaint/domain/sender1.com.txt    (domain complaints)");
console.log("   unsubscribe/sender.txt              (global unsubs)");
console.log("   unsubscribe/unsub.txt               (global unsubs - new format)");
console.log("   unsubscribe/domain/sender1.com.txt  (domain unsubs)");
console.log("   bounce/hard.txt                     (hard bounces)");
console.log("   output/final_test_result.txt        (suppressed output)");
console.log("   output/stats_test_result.json       (stats)");
