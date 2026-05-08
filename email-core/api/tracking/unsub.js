import fs from "fs/promises";
import path from "path";
import LinkToken from "../../models/LinkToken.js";
import SenderUnsub from "../../models/SenderUnsub.js";
import UnsubLog from "../../models/UnsubLog.js";
import normalizeEmail from "../../utils/normalizeEmail.js";
import { PATHS } from "../../config/paths.js";
import {
  getClientMeta,
  getPacificDayString,
  decryptToken,
  isOldToken,
} from "./helpers.js";

/* ===============================
   TRACK UNSUB
=============================== */
export default async function trackUnsub(req, res) {
  res.setHeader("Content-Type", "text/html; charset=utf-8");

  try {
    const token = String(req.query.k || "").trim();
    if (!token) return success(res);

    let link = null;
    let isNew = false;

    /* =========================
       TOKEN RESOLUTION
    ========================= */

    if (isOldToken(token)) {
      link = await LinkToken.findOne({
        token,
        type: "unsub",
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
      if (!data) return success(res);

      isNew = true;

      link = {
        offer_id: data.offer_id,
        email: data.email,
        list_id: data.list_id,
        send_domain: data.send_domain,
        vmta: data.vmta,
      };
    }

    if (!link?.email || !link?.offer_id) {
      return success(res);
    }

    const email = normalizeEmail(link.email);

    /* =========================
       🔥 FAST RESPONSE FIRST
    ========================= */
    success(res);

    /* =========================
       BACKGROUND PROCESS
    ========================= */
    setImmediate(async () => {
      try {
        const { ip, userAgent } = getClientMeta(req);
        const day = getPacificDayString(new Date());

        const promises = [
          /* 1️⃣ UNSUB LOG */
          UnsubLog.updateOne(
            {
              email,
              offer_id: link.offer_id,
              day,
            },
            {
              $setOnInsert: {
                email,
                offer_id: link.offer_id,
                list_id: link.list_id || null,
                send_domain: link.send_domain || null,
                vmta: link.vmta || null,
                ip,
                userAgent,
                source: "link",
                day,
              },
            },
            { upsert: true }
          ),

          /* 2️⃣ GLOBAL SUPPRESSION */
          SenderUnsub.updateOne(
            { email },
            {
              $setOnInsert: {
                email,
                ip,
                userAgent: userAgent || null,
                source: "one-click",
                createdAt: new Date(),
              },
            },
            { upsert: true }
          ),
        ];

        /* 3️⃣ OLD TOKEN UPDATE */
        if (!isNew) {
          promises.push(
            LinkToken.updateOne(
              { token },
              {
                $set: {
                  unsubscribed: true,
                  unsub_at: new Date(),
                  unsub_ip: ip,
                },
              }
            )
          );
        }

        await Promise.allSettled(promises);

        /* 4️⃣ FILE WRITE (NON-BLOCKING) */
        try {
          const file = path.join(PATHS.unsub, "sender.txt");
          await fs.mkdir(PATHS.unsub, { recursive: true });
          await fs.appendFile(file, email + "\n", "utf8");
        } catch (e) {
          console.error("FILE WRITE ERROR:", e);
        }

      } catch (err) {
        console.error("UNSUB BG ERROR:", err);
      }
    });

  } catch (err) {
    console.error("UNSUB ERROR:", err);
    return success(res);
  }
}

/* ===============================
   SUCCESS PAGE
=============================== */
function success(res) {
  return res.send(`
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Unsubscribe Confirmation</title>

<style>
body{
  margin:0;
  font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
  background:#f4f6f8;
  display:flex;
  align-items:center;
  justify-content:center;
  height:100vh;
}

.card{
  background:#ffffff;
  border:1px solid #e5e7eb;
  border-radius:12px;
  padding:35px;
  max-width:450px;
  width:90%;
  text-align:center;
  box-shadow:0 8px 25px rgba(0,0,0,0.08);
}

.icon{
  width:60px;
  height:60px;
  margin:0 auto 20px;
  background:#e5e7eb;
  border-radius:50%;
  display:flex;
  align-items:center;
  justify-content:center;
  font-size:30px;
}

p{
  font-size:15px;
  color:#374151;
  line-height:1.6;
  margin:10px 0;
}

a{
  color:#2563eb;
  text-decoration:none;
}

a:hover{
  text-decoration:underline;
}
</style>
</head>

<body>

<div class="card">

<div class="icon">😔</div>

<p><strong>You’ve been unsubscribed.</strong></p>

<p>You will no longer receive emails from us.</p>

<p>
If this was a mistake and you would like to subscribe again, please contact us at
<a href="mailto:resubscribe@blastbees.com">resubscribe@blastbees.com</a>.
</p>

<p>Thank you for your time.</p>

</div>

</body>
</html>
`);
}