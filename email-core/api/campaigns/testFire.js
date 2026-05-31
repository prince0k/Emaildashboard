import SenderServer from "../../models/SenderServer.js";
import Creative from "../../models/Creative.js";
import Offer from "../../models/Offer.js";
import SubjectLine from "../../models/SubjectLine.js";
import FromLine from "../../models/FromLine.js";
import TestId from "../../models/TestId.js";
import { callSender } from "./helpers/senderBridge.js";

export default async function testFireCampaign(req, res) {
  try {
    const {
      senderId,
      routes,
      routeIds,
      offerId,
      creativeId,
      subjectIds,
      fromIds,
      email,
      htmlOverride,
      headerMode,
      customHeaderBlock,
    } = req.body;

    if (!email || !senderId || !offerId || !creativeId) {
      return res.status(400).json({ error: "missing_fields_for_test" });
    }

    // Check if the email is an authorized Test ID
    const isAllowed = await TestId.findOne({ 
      email: email.toLowerCase().trim(),
      active: true 
    });

    if (!isAllowed) {
      return res.status(403).json({ 
        error: "unauthorized_test_id", 
        detail: `The email "${email}" is not in the authorized Test ID list. Please contact an Administrator to add this ID.` 
      });
    }

    const sender = await SenderServer.findById(senderId);
    if (!sender) return res.status(404).json({ error: "sender_not_found" });

    const offer = await Offer.findById(offerId);
    const creative = await Creative.findById(creativeId);

    // Resolve assets
    const subjectList = await SubjectLine.find({ _id: { $in: subjectIds || [] } });
    const fromLineList = await FromLine.find({ _id: { $in: fromIds || [] } });

    const subject = subjectList.length > 0 
      ? subjectList[Math.floor(Math.random() * subjectList.length)].text 
      : "Safety Test Mail";
      
    const fromLine = fromLineList.length > 0 
      ? fromLineList[Math.floor(Math.random() * fromLineList.length)].text 
      : "Safety Test";

    // Build the header block
    let customHeadersBlock = [
      "Date: {date}",
      "From: {fromName} <{fromEmail}>",
      "To: <{to}>",
      "Reply-To: {replyTo}",
      "Subject: {subject}",
      "Message-ID: {mid}",
      "MIME-Version: 1.0",
      "List-Unsubscribe: <{listUnsubUrl}>",
      "List-Unsubscribe-Post: List-Unsubscribe=One-Click",
      "Content-Type: multipart/alternative; boundary=\"{boundary}\"",
      "X-virtual-MTA: {vmta}",
    ].join("\n");

    if (headerMode === "custom" && customHeaderBlock) {
      // Trim and normalize newlines to \r\n for RFC compliance
      customHeadersBlock = customHeaderBlock.trim().replace(/\r?\n/g, "\r\n");
    }

    // Ensure the block uses \r\n
    if (headerMode !== "custom") {
      customHeadersBlock = customHeadersBlock.replace(/\n/g, "\r\n");
    }

    // Resolve VMTA and Domain from selected routes or fallback to first available
    if (!sender.routes || sender.routes.length === 0) {
      return res.status(400).json({ 
        error: "no_routes_available", 
        detail: "The selected Sender Server has no routes configured. Please add a route in Senders management before testing." 
      });
    }

    let vmta = sender.routes[0].vmta;
    let fromEmail = `${sender.routes[0].from_user || "mailer"}@${sender.routes[0].domain}`;

    if (routes && Array.isArray(routes) && routes.length > 0) {
      const selectedRoute = routes[0];
      vmta = selectedRoute.vmta;
      fromEmail = `${selectedRoute.from_user || "mailer"}@${selectedRoute.domain}`;
    } else if (routeIds && routeIds.length > 0) {
      const selectedRoute = sender.routes.find(r => String(r._id) === String(routeIds[0]));
      if (selectedRoute) {
        vmta = selectedRoute.vmta;
        fromEmail = `${selectedRoute.from_user || "mailer"}@${selectedRoute.domain}`;
      }
    }

    console.log("📥 TEST FIRE Request Body:", JSON.stringify(req.body, null, 2));

    const payload = {
      to: email,
      fromEmail: fromEmail, 
      fromName: fromLine,
      subject: subject,
      html: htmlOverride || creative?.html || "<h1>Safety Test</h1>",
      vmta: vmta,
      customHeaders: customHeadersBlock,
      textEncoding: req.body.textEncoding || "base64",
      htmlEncoding: req.body.htmlEncoding || "base64",
      text_encoding: req.body.textEncoding || "base64",
      html_encoding: req.body.htmlEncoding || "base64"
    };

    // Use the same helper used for triggers (sendWelcomeEmail.php)
    const senderUrl = sender.baseUrl.replace(/\/$/, "") + "/sendWelcomeEmail.php";
    const internalKey = process.env.SENDER_INTERNAL_KEY;

    console.log("🔥 TEST FIRE Payload:", JSON.stringify(payload, null, 2));
    console.log("🚀 TEST FIRE Sender URL:", senderUrl);

    try {
      const fireRes = await fetch(senderUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Internal-Key": internalKey,
        },
        body: JSON.stringify(payload),
      });

      if (!fireRes.ok) {
        const text = await fireRes.text();
        console.error("❌ TEST FIRE Sender Error:", fireRes.status, text);
        return res.status(502).json({ error: "sender_failed", detail: text });
      }

      console.log("✅ TEST FIRE Success");
      return res.json({ success: true, message: "Test fired to " + email });

    } catch (fetchErr) {
      console.error("🔥 TEST FIRE Fetch Exception:", fetchErr);
      throw fetchErr;
    }

  } catch (err) {
    console.error("TEST FIRE ERROR:", err);
    return res.status(500).json({ error: "test_fire_failed", message: err.message });
  }
}
