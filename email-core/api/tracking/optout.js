import LinkToken from "../../models/LinkToken.js";
import Deploy from "../../models/Deploy.js";
import OptoutLog from "../../models/OptoutLog.js";
import normalizeEmail from "../../utils/normalizeEmail.js";
import {
  getClientMeta,
  getPacificDayString,
  decryptToken,
  isOldToken,
} from "./helpers.js";

/* =========================
   HELPERS
========================= */

function isValidAbsoluteUrl(url) {
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/* =========================
   TRACK OPTOUT
========================= */

export default async function trackOptout(req, res) {
  try {
    const token = String(req.query.k || "").trim();
    if (!token) {
      return res.status(400).send("Invalid optout token");
    }

    let link = null;
    let isNew = false;

    /* =========================
       TOKEN RESOLUTION
    ========================= */

    if (isOldToken(token)) {
      link = await LinkToken.findOne({
        token,
        type: "optout",
      })
        .select({
          offer_id: 1,
          email: 1,
          list_id: 1,
          send_domain: 1,
          vmta: 1,
        })
        .lean();
    } else {
      const data = decryptToken(token);
      if (!data) {
        return res.status(400).send("Invalid optout token");
      }

      isNew = true;

      link = {
        offer_id: data.offer_id,
        email: data.email,
        list_id: data.list_id,
        send_domain: data.send_domain,
        vmta: data.vmta,
      };
    }

    if (!link?.email) {
      console.error("❌ EMAIL MISSING IN TOKEN", link);
    }

    const email = normalizeEmail(link.email);

    /* =========================
       FETCH DEPLOY
    ========================= */

    const deploy = await Deploy.findOne({
      offer_id: link.offer_id,
      status: "DEPLOYED",
    })
      .select({ optoutLink: 1 })
      .lean();

    if (!deploy || !isValidAbsoluteUrl(deploy.optoutLink)) {
      return res.status(400).send("Optout URL not configured");
    }

    const optoutUrl = deploy.optoutLink;

    /* =========================
       FAST REDIRECT FIRST
    ========================= */

    const urlObj = new URL(optoutUrl);
    urlObj.searchParams.set("email", email);

    res.writeHead(302, {
      Location: urlObj.toString(),
      Connection: "close",
    });
    res.end();

    /* =========================
       BACKGROUND LOG
    ========================= */

    (async () => {
  try {
    const { ip, userAgent, country } = getClientMeta(req);
    const day = getPacificDayString(new Date());

    const promises = [
      OptoutLog.updateOne(
        { email, offer_id: link.offer_id },
        {
          $setOnInsert: {
            offer_id: link.offer_id,
            email,
            list_id: link.list_id || null,
            send_domain: link.send_domain || null,
            vmta: link.vmta || null,
            url: optoutUrl,
            ip,
            userAgent,
            country,
            day,
            createdAt: new Date(),
          },
        },
        { upsert: true }
      ),
    ];

    if (!isNew) {
      promises.push(
        LinkToken.updateOne(
          { token },
          {
            $set: {
              opted_out: true,
              optout_at: new Date(),
              optout_ip: ip,
            },
          }
        )
      );
    }

    await Promise.allSettled(promises);

  } catch (err) {
    console.error("OPTOUT BG ERROR:", err);
  }
})();

  } catch (err) {
    console.error("TRACK OPTOUT ERROR:", err);

    if (!res.headersSent) {
      return res.status(500).send("Optout failed");
    }
  }
}