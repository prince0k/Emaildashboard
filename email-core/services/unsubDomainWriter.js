import fs from "fs";
import path from "path";
import UnsubLog from "../models/UnsubLog.js";

const DATA_ROOT = process.env.DATA_ROOT || "/var/www/email-core-data";
const GLOBAL_UNSUB_PATH = path.join(DATA_ROOT, "unsubscribe", "unsub.txt");
const DOMAIN_UNSUB_DIR = path.join(DATA_ROOT, "unsubscribe", "domain");
const GLOBAL_PATH = path.join(DATA_ROOT, "global", "normalized.txt");

const DOMAIN_ESCALATION_THRESHOLD = 2;

/**
 * Write unsubscribe to domain-level file + check escalation.
 * Called from the unsub tracking handler after each unsub event.
 *
 * @param {string} email - The email address that unsubscribed
 * @param {string} domain - The sending domain (from the campaign route)
 */
export async function writeDomainUnsub(email, domain) {
  if (!email) return;

  const normalizedEmail = email.trim().toLowerCase();

  /* ===== DOMAIN-LEVEL FILE ===== */
  if (domain) {
    try {
      if (!fs.existsSync(DOMAIN_UNSUB_DIR)) {
        fs.mkdirSync(DOMAIN_UNSUB_DIR, { recursive: true });
      }

      const domainFile = path.join(DOMAIN_UNSUB_DIR, `${domain.toLowerCase()}.txt`);

      let domainSet = new Set();
      if (fs.existsSync(domainFile)) {
        domainSet = new Set(
          fs.readFileSync(domainFile, "utf-8").split("\n").filter(Boolean)
        );
      }

      if (!domainSet.has(normalizedEmail)) {
        fs.appendFileSync(domainFile, normalizedEmail + "\n");
        console.log(`✅ Unsub saved (domain ${domain}):`, normalizedEmail);
      }
    } catch (e) {
      console.error("Domain unsub write error:", e);
    }
  }

  /* ===== ESCALATION CHECK ===== */
  try {
    // Count distinct domains this email has unsubbed from
    const distinctDomains = await UnsubLog.distinct("send_domain", {
      email: normalizedEmail,
      send_domain: { $ne: null },
    });

    if (distinctDomains.length >= DOMAIN_ESCALATION_THRESHOLD) {
      // Escalate to global unsub file
      let globalSet = new Set();
      if (fs.existsSync(GLOBAL_UNSUB_PATH)) {
        globalSet = new Set(
          fs.readFileSync(GLOBAL_UNSUB_PATH, "utf-8").split("\n").filter(Boolean)
        );
      }

      if (!globalSet.has(normalizedEmail)) {
        fs.appendFileSync(GLOBAL_UNSUB_PATH, normalizedEmail + "\n");
        console.log("🔥 Unsub ESCALATED to global:", normalizedEmail, `(${distinctDomains.length} domains)`);
      }

      // Also add to global/normalized.txt
      if (fs.existsSync(GLOBAL_PATH)) {
        const globalNormSet = new Set(
          fs.readFileSync(GLOBAL_PATH, "utf-8").split("\n").filter(Boolean)
        );
        if (!globalNormSet.has(normalizedEmail)) {
          fs.appendFileSync(GLOBAL_PATH, normalizedEmail + "\n");
        }
      }
    }
  } catch (e) {
    console.error("Unsub escalation check error:", e);
  }
}
