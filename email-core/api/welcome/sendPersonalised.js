/**
 * POST /api/welcome/send-personalised
 *
 * Auth: X-Internal-Key header
 */

import SenderServer from "../../models/SenderServer.js";
import Lead from "../../models/Lead.js";
import { buildPersonalisedEmailHtml } from "./personalisedTemplate.js";

const INTERNAL_KEY = process.env.SENDER_INTERNAL_KEY;

export default async function sendPersonalisedEmail(req, res) {
  try {
    const incomingKey = req.headers["x-internal-key"];

    if (!INTERNAL_KEY || !incomingKey || incomingKey !== INTERNAL_KEY) {
      return res.status(403).json({ error: "forbidden" });
    }

    const {
      email,
      name,
      viewUrl,
      siteName,
    } = req.body;

    if (!email || !viewUrl) {
      return res.status(400).json({ error: "missing_required_fields" });
    }

    const { getTriggerSender } = await import("../../lib/getTriggerSender.js");
    const { sender, route } = await getTriggerSender("WELCOME");

    if (!sender || !route) {
      return res.status(503).json({ error: "no_sender_available" });
    }

    const fromEmail = `${route.from_user}@${route.domain}`;
    const fromName = siteName || "NutriGuide";
    const subject = `Your Personalised Plan is Ready! 🎉 - ${fromName}`;

    const html = buildPersonalisedEmailHtml({
      name: name || "",
      siteName: fromName,
      viewUrl,
    });

    const senderUrl = sender.baseUrl.replace(/\/$/, "") + "/sendWelcomeEmail.php";

    const senderRes = await fetch(senderUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Key": INTERNAL_KEY,
      },
      body: JSON.stringify({
        to: email,
        toName: name || "",
        fromEmail,
        fromName,
        subject,
        html,
        vmta: route.vmta,
      }),
    });

    const senderData = await senderRes.json().catch(() => ({}));

    if (!senderRes.ok) {
      return res.status(502).json({ error: "sender_failed", detail: senderData });
    }

    // LOG LEAD
    try {
      await Lead.create({
        email,
        name: name || "",
        siteName: fromName,
        siteUrl: viewUrl,
        sender: sender.name,
        route: `${route.vmta}/${route.domain}`,
        messageId: senderData.messageId || null,
        status: "SENT",
      });
    } catch (logErr) {
      console.error("❌ PERSONALISED: Failed to log lead:", logErr);
    }

    return res.json({
      success: true,
      messageId: senderData.messageId || null,
    });

  } catch (err) {
    console.error("🔥 SEND PERSONALISED ERROR:", err);
    return res.status(500).json({ error: "send_failed", message: err.message });
  }
}
