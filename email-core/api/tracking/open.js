import LinkToken from "../../models/LinkToken.js";
import OpenLog from "../../models/OpenLog.js";
import normalizeEmail from "../../utils/normalizeEmail.js";
import {
  getClientMeta,
  decryptToken,
  isOldToken,
  getPacificDayString,
} from "./helpers.js";

/* =========================
   TRACK OPEN
========================= */

export default async function trackOpen(req, res) {
  // 🔥 ALWAYS respond first (pixel)
  sendPixel(res);

  try {
    const token = String(req.query.k || "").trim();
    if (!token) return;

    let link = null;
    let isNew = false;

    /* =========================
       TOKEN RESOLUTION
    ========================= */

    if (isOldToken(token)) {
      link = await LinkToken.findOne({
        token,
        type: "open",
      })
        .select({
          offer_id: 1,
          campaignId: 1,
          offerId: 1,
          email: 1,
          send_domain: 1,
          vmta: 1,
          list_id: 1,
        })
        .lean();
    } else {
      const data = decryptToken(token);
      if (!data) return;

      isNew = true;

      link = {
        offer_id: data.offer_id,
        campaignId: data.campaignId,
        offerId: data.offerId,
        email: data.email,
        send_domain: data.send_domain,
        vmta: data.vmta,
        list_id: data.list_id,
      };
    }

    if (!link || !link.offer_id) return;

    /* =========================
       NORMALIZE
    ========================= */

    const email = link.email ? normalizeEmail(link.email) : null;
    const day = getPacificDayString(new Date());

    const { ip, userAgent, country } = getClientMeta(req);
    const bot = isBot(userAgent);

    /* =========================
       MATCH (NEW SYSTEM)
    ========================= */

    const match = {
      offer_id: link.offer_id,
      day,
      ...(email ? { email } : { token }), // fallback only
    };

    /* =========================
       BACKGROUND PROCESSING
    ========================= */

    setImmediate(async () => {
      try {
        const promises = [
          OpenLog.updateOne(
            match,
            {
              $setOnInsert: {
                offer_id: link.offer_id,
                campaignId: link.campaignId || null,
                offerId: link.offerId || null,
                email,

                send_domain: link.send_domain || null,
                vmta: link.vmta || null,
                list_id: link.list_id || null,

                day,

                ip,
                userAgent,
                country,

                unique_open_count: 1, // 🔥 always 1 per user/day
              },

              $inc: {
                total_open_count: 1,
                bot_open_count: bot ? 1 : 0,
              },
            },
            { upsert: true }
          ),
        ];

        // 🟢 OLD TOKEN SUMMARY UPDATE
        if (!isNew) {
          promises.push(
            LinkToken.updateOne(
              { token },
              [
                {
                  $set: {
                    open_count: {
                      $add: [{ $ifNull: ["$open_count", 0] }, 1],
                    },
                    first_open_at: {
                      $ifNull: ["$first_open_at", new Date()],
                    },
                    last_open_at: new Date(),
                    open_ip: ip,
                    open_ua: userAgent,
                    is_bot_open: bot,
                  },
                },
              ]
            )
          );
        }

        await Promise.allSettled(promises);

      } catch (err) {
        console.error("OPEN BG ERROR:", err);
      }
    });

  } catch (err) {
    console.error("OPEN ERROR:", err);
  }
}

/* =========================
   BOT DETECTION
========================= */

function isBot(userAgent = "") {
  const bots = [
    "googleimageproxy",
    "googlebot",
    "barracuda",
    "proofpoint",
    "mimecast",
    "trend micro",
    "spam titan",
    "cisco",
    "fireeye",
    "avanan",
    "bitdefender",
    "eset",
    "outlook",
    "thunderbird",
    "applemail",
    "curl",
    "wget",
  ];

  const ua = userAgent.toLowerCase();

  return bots.some((bot) => ua.includes(bot));
}

/* =========================
   PIXEL RESPONSE
========================= */

function sendPixel(res) {
  const gif = Buffer.from(
    "R0lGODlhAQABAIABAP///wAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==",
    "base64"
  );

  res.setHeader("Content-Type", "image/gif");
  res.setHeader("Cache-Control", "no-store, no-cache, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  res.end(gif);
}