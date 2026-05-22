/**
 * POST /api/welcome/send
 *
 * Receives subscriber data from the recipe site,
 * builds a welcome email, and triggers the sender server
 * to inject it into PMTA.
 *
 * Auth: X-Internal-Key header (same SENDER_INTERNAL_KEY)
 */

import SenderServer from "../../models/SenderServer.js";
import Lead from "../../models/Lead.js";
import { buildWelcomeEmailHtml } from "./template.js";
import fs from "fs";
import path from "path";

const INTERNAL_KEY = process.env.SENDER_INTERNAL_KEY;

export default async function sendWelcomeEmail(req, res) {
  try {

    /* ======================
       AUTH (internal key)
    ====================== */

    const incomingKey = req.headers["x-internal-key"];

    if (!INTERNAL_KEY || !incomingKey || incomingKey !== INTERNAL_KEY) {
      return res.status(403).json({ error: "forbidden" });
    }

    /* ======================
       INPUT
    ====================== */

    const {
      email,
      name,
      siteUrl,
      siteName,
      senderCode, // optional — pick specific sender server
    } = req.body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return res.status(400).json({ error: "invalid_email" });
    }

    /* ======================
       FIND SENDER SERVER & ROUTE
    ====================== */

    const { getTriggerSender } = await import("../../lib/getTriggerSender.js");
    const { sender, route } = await getTriggerSender("WELCOME");

    if (!sender || !route) {
      console.error("❌ WELCOME: No active sender or route found");
      return res.status(503).json({ error: "no_sender_available" });
    }

    const fromEmail = `${route.from_user}@${route.domain}`;
    const fromName = siteName || "NutriGuide";
    const subject = `Welcome to ${fromName}! Here are your free resources 🎉`;

    /* ======================
       BUILD EMAIL HTML
    ====================== */

    const html = buildWelcomeEmailHtml({
      name: name || "",
      siteUrl: siteUrl || `https://${route.domain}`,
      siteName: fromName,
    });

    /* ======================
       CALL SENDER SERVER
    ====================== */

    const senderUrl = sender.baseUrl.replace(/\/$/, "") + "/sendWelcomeEmail.php";

    console.log(`📧 WELCOME: Sending to ${email} via ${sender.name} (${route.vmta}/${route.domain})`);

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

    const senderText = await senderRes.text();
    let senderData;
    try {
      senderData = JSON.parse(senderText);
    } catch {
      senderData = { raw: senderText };
    }

    /* ======================
       LOG LEAD
    ====================== */

    const leadData = {
      email,
      name: name || "",
      siteName: fromName,
      siteUrl: siteUrl || "",
      sender: sender.name,
      route: `${route.vmta}/${route.domain}`,
      messageId: senderData.messageId || null,
      status: senderRes.ok ? "SENT" : "FAILED",
      error: senderRes.ok ? null : (senderData.detail || senderText),
    };

    try {
      await Lead.create(leadData);
    } catch (logErr) {
      console.error("❌ WELCOME: Failed to log lead:", logErr);
    }

    if (!senderRes.ok) {
      console.error("❌ WELCOME: Sender HTTP", senderRes.status, senderText);
      return res.status(502).json({
        error: "sender_failed",
        status: senderRes.status,
        detail: senderText,
      });
    }

    console.log(`✅ WELCOME: Sent to ${email}`, senderData);

    /* ======================
       APPEND TO SEGMENT
    ====================== */
    try {
      const segmentPath = path.join(process.cwd(), "..", "email-core-data", "segments", "subscribers.txt");
      const fname = (name || "").split(" ")[0] || "";
      const lname = (name || "").split(" ").slice(1).join(" ") || "";
      const line = `leads|${email}|stewatlucus|${fname}|${lname}||||||\n`;
      
      fs.appendFileSync(segmentPath, line);
      console.log(`📁 WELCOME: Lead appended to subscribers.txt`);
    } catch (segErr) {
      console.error("❌ WELCOME: Failed to append to segment:", segErr);
    }

    return res.json({
      success: true,
      to: email,
      sender: sender.name,
      route: `${route.vmta}/${route.domain}`,
      messageId: senderData.messageId || null,
    });

  } catch (err) {
    console.error("🔥 WELCOME ERROR:", err);
    return res.status(500).json({ error: "welcome_send_failed", message: err.message });
  }
}
