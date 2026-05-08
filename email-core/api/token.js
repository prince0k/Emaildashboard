import LinkToken from "../models/LinkToken.js";
import normalizeEmail from "../utils/normalizeEmail.js";

const TTL = {
  open:   365 * 24 * 60 * 60 * 1000,
  click:  3   * 24 * 60 * 60 * 1000,
  optout: 30  * 24 * 60 * 60 * 1000,
  unsub:  30  * 24 * 60 * 60 * 1000,
};

const TOKEN_REGEX = /^[a-f0-9]{16,64}$/i;

export default async function registerToken(req, res) {
  try {
    const {
      token,
      type,
      offer_id,
      email,
      rl,
      list_id,

      // 🔥 NEW FIELDS
      send_domain,
      vmta,
    } = req.body;

    /* ---------- VALIDATION ---------- */

    if (!token || !type || !TTL[type]) {
      return res.status(400).json({ error: "invalid_payload" });
    }

    if (!TOKEN_REGEX.test(token)) {
      return res.status(400).json({ error: "invalid_token_format" });
    }

    if (type !== "open" && !email) {
      return res.status(400).json({ error: "email_required" });
    }

    if (type === "click" && !Number.isInteger(Number(rl))) {
      return res.status(400).json({ error: "invalid_rl" });
    }

    if (["open", "click", "optout"].includes(type) && !offer_id) {
      return res.status(400).json({ error: "offer_id_required" });
    }

    const expiresAt = new Date(Date.now() + TTL[type]);

    /* ---------- UPSERT ---------- */

    await LinkToken.updateOne(
      { token },
      {
        $setOnInsert: {
          token,
          type,
          offer_id: offer_id || null,
          email: email ? normalizeEmail(email) : null,
          rl: rl ?? null,
          list_id: list_id || null,

          // 🔥 sender metadata
          send_domain: send_domain || null,
          vmta: vmta || null,

          createdAt: new Date(),
        },
        $set: {
          expiresAt,
        },
      },
      { upsert: true }
    );

    return res.json({ status: "ok" });
  } catch (err) {
    console.error("TOKEN ERROR:", err);
    return res.status(500).json({ error: "server_error" });
  }
}