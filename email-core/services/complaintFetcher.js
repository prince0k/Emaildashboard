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
import "../config/mongo.js";
import LinkToken from "../models/LinkToken.js";
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
   FILE PATH
====================== */
const FILE_PATH = "/var/www/email-core-data/complaint/complaint.txt";

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
   SAVE EMAIL (NO DUPES)
====================== */
const appendUniqueEmail = async (email) => {

    if (!existingEmails.has(email)) {
        fs.appendFileSync(FILE_PATH, email + "\n");
        existingEmails.add(email);
        console.log("✅ Saved:", email);
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
     🔥 MAIN FIX (ComplaintLog)
  ========================= */

  if (email && offer_id) {
    await ComplaintLog.updateOne(
      {
        offer_id,
        email,
      },
      {
        $setOnInsert: {
          offer_id,
          email,
          day: new Date().toISOString().slice(0, 10),
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );

    console.log("📊 ComplaintLog updated:", email);
  }

  await appendUniqueEmail(email);
}

