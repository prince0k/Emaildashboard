/**
 * POST /api/welcome/send-custom
 *
 * Auth: X-Internal-Key header
 */
import SenderServer from "../../models/SenderServer.js";
import Lead from "../../models/Lead.js";
import { buildCustomEmailHtml } from "./customTemplate.js";

const INTERNAL_KEY = process.env.SENDER_INTERNAL_KEY;

export default async function sendCustomEmail(req, res) {
  try {
    const incomingKey = req.headers["x-internal-key"];

    if (!INTERNAL_KEY || !incomingKey || incomingKey !== INTERNAL_KEY) {
      return res.status(403).json({ error: "forbidden" });
    }

    const {
      email,
      subject,
      htmlContent,
      siteName,
    } = req.body;

    if (!email || !subject || !htmlContent) {
      return res.status(400).json({ error: "missing_required_fields" });
    }

    const { getTriggerSender } = await import("../../lib/getTriggerSender.js");
    const { sender, route } = await getTriggerSender("WELCOME");

    if (!sender || !route) {
      return res.status(503).json({ error: "no_sender_available" });
    }

    const fromEmail = `${route.from_user}@${route.domain}`;
    const fromName = siteName || "NutriGuide";

    const html = buildCustomEmailHtml({
      subject,
      htmlContent,
    });

    const senderUrl = sender.baseUrl.replace(/\/$/, "") + "/sendWelcomeEmail.php";

    console.log(`📧 CUSTOM EMAIL: Sending "${subject}" to ${email} via ${sender.name}`);

    const senderRes = await fetch(senderUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Key": INTERNAL_KEY,
      },
      body: JSON.stringify({
        to: email,
        toName: "",
        fromEmail,
        fromName,
        subject,
        html,
        vmta: route.vmta,
      }),
    });

    const senderText = await senderRes.text();
    let senderData;
    try {
      senderData = JSON.parse(senderText);
    } catch {
      senderData = { raw: senderText };
    }

    if (!senderRes.ok) {
      console.error("❌ CUSTOM EMAIL: Sender failed", senderRes.status, senderText);
      return res.status(502).json({ error: "sender_failed", detail: senderData });
    }

    // Log the send in MongoDB Lead collection
    try {
      await Lead.create({
        email,
        name: "Admin Notification",
        siteName: fromName,
        siteUrl: "",
        sender: sender.name,
        route: `${route.vmta}/${route.domain}`,
        messageId: senderData.messageId || null,
        status: "SENT",
      });
    } catch (logErr) {
      console.error("❌ CUSTOM EMAIL: Failed to log lead:", logErr);
    }

    return res.json({
      success: true,
      messageId: senderData.messageId || null,
    });

  } catch (err) {
    console.error("🔥 SEND CUSTOM EMAIL ERROR:", err);
    return res.status(500).json({ error: "send_failed", message: err.message });
  }
}
