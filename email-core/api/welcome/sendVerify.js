import { buildVerificationEmailHtml } from "./verificationTemplate.js";
import SenderServer from "../../models/SenderServer.js";
import Lead from "../../models/Lead.js";

export default async function sendVerificationEmail(req, res) {
  try {
    /* ======================
       AUTH (internal key)
    ====================== */
    const INTERNAL_KEY = process.env.SENDER_INTERNAL_KEY;
    const incomingKey = req.headers["x-internal-key"];

    if (!INTERNAL_KEY || !incomingKey || incomingKey !== INTERNAL_KEY) {
      return res.status(403).json({ error: "forbidden" });
    }

    const { email, name, verifyUrl, siteName } = req.body;

    if (!email || !verifyUrl) {
      return res.status(400).json({ error: "missing_fields" });
    }

    // 1. Find active sender & route
    const { getTriggerSender } = await import("../../lib/getTriggerSender.js");
    const { sender, route } = await getTriggerSender("VERIFICATION");

    if (!sender || !route) {
      return res.status(500).json({ error: "no_active_sender_or_route" });
    }

    // 2. Build HTML
    const html = buildVerificationEmailHtml({
      name,
      verifyUrl,
      siteName: siteName || "NutriGuide"
    });

    const fromName = siteName || "NutriGuide";
    const fromEmail = `${route.from_user}@${route.domain}`;

    // 3. Send via Sender Server
    const senderEndpoint = sender.baseUrl.replace(/\/$/, "") + "/sendWelcomeEmail.php";
    
    const senderRes = await fetch(senderEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Key": process.env.SENDER_INTERNAL_KEY,
      },
      body: JSON.stringify({
        to: email,
        fromName,
        fromEmail,
        subject: `Confirm your email - ${fromName}`,
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

    // 4. Log Lead as "PENDING" or "VERIFY_SENT"
    if (!senderRes.ok) {
        console.error("❌ Sender Server Error:", senderData);
    }

    await Lead.create({
      email,
      name: name || "",
      siteName: fromName,
      siteUrl: verifyUrl.split("/verify")[0], // approx
      sender: sender.name,
      route: `${route.vmta}/${route.domain}`,
      messageId: senderData.messageId || null,
      status: senderRes.ok ? "VERIFY_SENT" : "FAILED",
      error: senderRes.ok ? null : JSON.stringify(senderData),
    });

    return res.json({
      success: senderRes.ok,
      messageId: senderData.messageId,
      error: senderRes.ok ? null : senderData
    });

  } catch (err) {
    console.error("🔥 VERIFICATION SEND ERROR:", err);
    return res.status(500).json({ error: "verification_send_failed" });
  }
}
