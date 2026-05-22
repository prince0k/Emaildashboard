import Imap from "imap";
import dotenv from "dotenv";
import ComplaintLog from "../models/ComplaintLog.js";

dotenv.config({
    path: "/var/www/email-core/.env"
});

import {
    simpleParser
} from "mailparser";
import fs from "fs";
import path from "path";
import "../config/mongo.js";
import LinkToken from "../models/LinkToken.js";
import Campaign from "../models/Campaign.js";
import {
    decryptToken,
    isOldToken
} from "../api/tracking/helpers.js";


/* ======================
   IMAP CONFIG (FIXED)
====================== */
let accounts = [];

try {
  accounts = JSON.parse(process.env.EMAIL_ACCOUNTS || "[]");
} catch (e) {
  console.error("❌ INVALID EMAIL_ACCOUNTS JSON");
  process.exit(1);
}

const baseConfig = {
    host: "imap.gmail.com",
    port: 993,
    tls: true,
    tlsOptions: {
        rejectUnauthorized: false
    },
};

/* ======================
   FILE PATHS
====================== */
const DATA_ROOT = process.env.DATA_ROOT || "/var/www/email-core-data";
const FILE_PATH = path.join(DATA_ROOT, "complaint", "complaint.txt");
const DOMAIN_DIR = path.join(DATA_ROOT, "complaint", "domain");
const GLOBAL_PATH = path.join(DATA_ROOT, "global", "normalized.txt");

// Escalation threshold: complaint on N+ domains = global
const DOMAIN_ESCALATION_THRESHOLD = 2;

/* ======================
   LOAD EXISTING (FAST)
====================== */
let existingEmails = new Set();

if (fs.existsSync(FILE_PATH)) {
    existingEmails = new Set(
        fs.readFileSync(FILE_PATH, "utf-8").split("\n").filter(Boolean)
    );
}

/* ======================
   TOKEN EXTRACT (STRONG)
====================== */
const extractTokenFromUrl = (text) => {
    if (!text) return null;

    const match = text.match(/[?&]k=([a-zA-Z0-9\-_]+)/);
    return match ? match[1].trim() : null;
};

/* ======================
   SAVE EMAIL (GLOBAL — NO DUPES)
====================== */
const appendUniqueEmail = async (email) => {

    if (!existingEmails.has(email)) {
        fs.appendFileSync(FILE_PATH, email + "\n");
        existingEmails.add(email);
        console.log("✅ Saved (global):", email);
    }
};

/* ======================
   SAVE EMAIL (DOMAIN-LEVEL)
====================== */
const appendDomainComplaint = (email, domain) => {
    if (!domain) return;

    try {
        if (!fs.existsSync(DOMAIN_DIR)) {
            fs.mkdirSync(DOMAIN_DIR, { recursive: true });
        }

        const domainFile = path.join(DOMAIN_DIR, `${domain.toLowerCase()}.txt`);

        // Load existing for this domain
        let domainSet = new Set();
        if (fs.existsSync(domainFile)) {
            domainSet = new Set(
                fs.readFileSync(domainFile, "utf-8").split("\n").filter(Boolean)
            );
        }

        if (!domainSet.has(email)) {
            fs.appendFileSync(domainFile, email + "\n");
            console.log(`✅ Saved (domain ${domain}):`, email);
        }
    } catch (e) {
        console.error("Domain complaint write error:", e);
    }
};

/* ======================
   ESCALATE TO GLOBAL
====================== */
const checkAndEscalate = async (email) => {
    try {
        // Count distinct domains this email has complained on
        const distinctDomains = await ComplaintLog.distinct("domain", {
            email,
            domain: { $ne: null },
        });

        if (distinctDomains.length >= DOMAIN_ESCALATION_THRESHOLD) {
            // Escalate to global complaint
            await appendUniqueEmail(email);

            // Also add to global/normalized.txt
            if (fs.existsSync(GLOBAL_PATH)) {
                const globalSet = new Set(
                    fs.readFileSync(GLOBAL_PATH, "utf-8").split("\n").filter(Boolean)
                );
                if (!globalSet.has(email)) {
                    fs.appendFileSync(GLOBAL_PATH, email + "\n");
                    console.log("🔥 ESCALATED to global:", email, `(${distinctDomains.length} domains)`);
                }
            }
        }
    } catch (e) {
        console.error("Escalation check error:", e);
    }
};


const HARD_BOUNCE_SENDERS = [
  "mailer-daemon@comcast.net",
  "mailer-daemon@yahoo.com"
];

/* ======================
   MAIN FUNCTION
====================== */
export const fetchComplaintEmails = async () => {
  for (const acc of accounts) {
    console.log(`\n📥 Checking: ${acc.user}`);
    await processInbox(acc);
  }
};

function processInbox(account) {
  return new Promise((resolve, reject) => {
    const imap = new Imap({
      ...baseConfig,
      user: account.user,
      password: account.pass,
    });

    imap.once("ready", () => {
      console.log(`✅ Connected: ${account.user}`);

      imap.openBox("INBOX", false, (err) => {
        if (err) return reject(err);

        imap.search(["UNSEEN"], (err, results) => {
          if (err) return reject(err);

          if (!results?.length) {
            console.log(`📭 No unread in ${account.user}`);
            imap.end();
            return resolve();
          }

          const fetch = imap.fetch(results, {
            bodies: "",
            markSeen: true,
          });

          const tasks = [];

          fetch.on("message", (msg) => {
            msg.on("body", (stream) => {
              const task = new Promise((done) => {
                simpleParser(stream, async (err, parsed) => {
  try {
    if (err || !parsed) return done(); // ✅ FIRST

    const fromEmail =
      parsed?.from?.value?.[0]?.address?.toLowerCase() || "";


if (HARD_BOUNCE_SENDERS.includes(fromEmail)) {
  console.log("💣 HARD BOUNCE MAIL:", fromEmail);

  let content = "";
  if (parsed.text) content += parsed.text;


  if (parsed.attachments?.length) {
    for (const att of parsed.attachments) {
      if (att.contentType === "message/rfc822") {
        content += att.content.toString();
      }
    }
  }

  let bouncedEmail = null;

  const rfcMatch = content.match(/Final-Recipient: rfc822;(.*)/i);
  if (rfcMatch) {
    bouncedEmail = rfcMatch[1].trim().toLowerCase();
  }

  if (!bouncedEmail) {
    const xMatch = content.match(/X-Failed-Recipients:\s*(.*)/i);
    if (xMatch) {
      bouncedEmail = xMatch[1].trim().toLowerCase();
    }
  }

  if (!bouncedEmail) {
    const fallback = content.match(/[\w.-]+@[\w.-]+\.\w+/g);
    if (fallback?.length) {
      bouncedEmail = fallback[0].toLowerCase();
    }
  }

  if (!bouncedEmail) {
    console.log("⚠️ Could not extract bounced email");
    return done();
  }

  await handleHardBounce(bouncedEmail);

  return done();
}
                  

                    let content = "";
                    if (parsed.text) content += parsed.text;
                    if (parsed.html) content += parsed.html;

                    if (parsed.attachments?.length) {
                      for (const att of parsed.attachments) {
                        if (att.contentType === "message/rfc822") {
                          content += att.content.toString();
                        }
                      }
                    }

                    const raw =
                      parsed?.headerLines?.map((h) => h.line).join("\n") || "";

                    const fullContent = content + "\n" + raw;

                    const token = extractTokenFromUrl(fullContent);
                    if (!token) return done();

                    console.log("🔑 Token:", token);

                    await handleToken(token);

                  } catch (e) {
                    console.error("Parse error:", e);
                  }

                  done();
                });
              });

              tasks.push(task);
            });
          });

          fetch.once("end", async () => {
            await Promise.all(tasks);
            imap.end();
            resolve();
          });
        });
      });
    });

    imap.once("error", reject);
    imap.connect();
  });
}
async function handleHardBounce(email) {
  console.log("📧 Hard bounce:", email);

  const HARD_FILE = "/var/www/email-core-data/bounce/hard.txt";

  let existing = new Set();
  if (fs.existsSync(HARD_FILE)) {
    existing = new Set(
      fs.readFileSync(HARD_FILE, "utf-8").split("\n").filter(Boolean)
    );
  }

  if (!existing.has(email)) {
    await fs.promises.appendFile(HARD_FILE, email + "\n");
  }

  await LinkToken.updateMany(
    { email },
    {
      $set: {
        hard_bounce: true,
        hard_bounce_at: new Date(),
      },
    }
  );

  console.log("🔥 Hard bounce saved + DB updated:", email);
}

async function handleToken(token) {
  let email = null;
  let offer_id = null;
  let sendDomain = null;

  if (isOldToken(token)) {
    const doc = await LinkToken.findOne({ token }).lean();

    if (!doc?.email) {
      console.log("❌ No email for OLD token:", token);
      return;
    }

    email = doc.email;
    offer_id = doc.offer_id;

    // OLD complaint mark
    if (!doc.complaint) {
      await LinkToken.updateOne(
        { token },
        {
          $set: {
            complaint: true,
            complaintAt: new Date(),
          },
        }
      );

      console.log("🔥 Complaint marked (OLD):", token);
    }

  } else {
    const data = decryptToken(token);

    if (!data?.email) {
      console.log("❌ No email in AES token:", token);
      return;
    }

    email = data.email;
    offer_id = data.offer_id || data.offerId || null;

    console.log("🔥 AES complaint:", email);

    // 🔥 IMPORTANT: AES tokens ke liye DB update
    await LinkToken.updateMany(
      { email, offer_id },
      {
        $set: {
          complaint: true,
          complaintAt: new Date(),
        },
      }
    );
  }

  /* =========================
     🔥 RESOLVE SENDING DOMAIN
  ========================= */
  if (offer_id) {
    try {
      // Find campaign that used this offer_id to get the sending domain
      const campaignDoc = await Campaign.findOne({
        runtimeOfferId: offer_id,
      }).lean();

      if (campaignDoc?.routes?.length > 0) {
        sendDomain = campaignDoc.routes[0].domain?.toLowerCase() || null;
      }
    } catch (e) {
      console.error("Domain resolve error:", e);
    }
  }

  /* =========================
     🔥 MAIN FIX (ComplaintLog)
  ========================= */

  if (email && offer_id) {
    await ComplaintLog.updateOne(
      {
        offer_id,
        email,
        domain: sendDomain || null,
      },
      {
        $setOnInsert: {
          offer_id,
          email,
          domain: sendDomain || null,
          day: new Date().toISOString().slice(0, 10),
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );

    console.log("📊 ComplaintLog updated:", email, "domain:", sendDomain);
  }

  /* =========================
     🔥 DOMAIN-LEVEL + ESCALATION
  ========================= */
  if (sendDomain) {
    // Write to domain-level file
    appendDomainComplaint(email, sendDomain);

    // Check multi-domain threshold → escalate if needed
    await checkAndEscalate(email);
  } else {
    // No domain info — write to global complaint directly (legacy behavior)
    await appendUniqueEmail(email);
  }
}

