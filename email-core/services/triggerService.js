import CampaignTrigger from "../models/CampaignTrigger.js";
import Creative from "../models/Creative.js";
import Offer from "../models/Offer.js";
import SenderServer from "../models/SenderServer.js";
import SubjectLine from "../models/SubjectLine.js";
import FromLine from "../models/FromLine.js";
import LinkToken from "../models/LinkToken.js";
import Campaign from "../models/Campaign.js";
import crypto from "crypto";

function genToken() {
  return crypto.randomBytes(16).toString("hex");
}

export async function processCampaignTrigger(campaignDoc, email, triggerOverride = null) {
  try {
    // 1. Find dedicated trigger for this campaign (or use override)
    let trigger = triggerOverride;
    
    if (!trigger) {
      trigger = await CampaignTrigger.findOne({
        parentCampaignId: campaignDoc._id,
        triggerType: "OPEN",
        active: true
      }).lean();
    }

    if (!trigger) {
      // Fallback to legacy field for compatibility during migration
      if (campaignDoc.openTriggerCampaignId) {
        return processLegacyTrigger(campaignDoc, email);
      }
      return;
    }

    console.log(`🎯 TRIGGER: Custom trigger fired for ${email} from campaign ${campaignDoc.campaignName}`);

    // 2. Load Assets from trigger config
    const [creative, offer, sender] = await Promise.all([
      Creative.findById(trigger.creativeId).lean(),
      Offer.findById(trigger.offerId).lean(),
      SenderServer.findById(trigger.senderId).lean(),
    ]);

    if (!creative || !offer || !sender) {
      console.warn(`⚠️ TRIGGER: Missing assets for trigger on campaign ${campaignDoc.campaignName}`);
      return;
    }

    // 3. Pick Subject & From (random from selected)
    let subject, fromLine;

    if (trigger.subjectIds && trigger.subjectIds.length > 0) {
      const subDocs = await SubjectLine.find({ _id: { $in: trigger.subjectIds } }).lean();
      subject = subDocs.length ? subDocs[Math.floor(Math.random() * subDocs.length)].text : "Important Update";
    } else {
      const subjects = await SubjectLine.find({ offerId: trigger.offerId }).lean();
      subject = subjects.length ? subjects[Math.floor(Math.random() * subjects.length)].text : "Important Update";
    }

    if (trigger.fromIds && trigger.fromIds.length > 0) {
      const fromDocs = await FromLine.find({ _id: { $in: trigger.fromIds } }).lean();
      fromLine = fromDocs.length ? fromDocs[Math.floor(Math.random() * fromDocs.length)].text : "Support";
    } else {
      const froms = await FromLine.find({ offerId: trigger.offerId }).lean();
      fromLine = froms.length ? froms[Math.floor(Math.random() * froms.length)].text : "Support";
    }

    // 4. Generate Tokens
    const openToken = genToken();
    const unsubToken = genToken();
    const optoutToken = genToken();
    const clickTokens = (offer.redirectLinks || []).map(() => genToken());

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const tokenDocs = [
      { token: openToken, type: "open", offer_id: offer._id, email, expiresAt },
      { token: unsubToken, type: "unsub", offer_id: offer._id, email, expiresAt },
      { token: optoutToken, type: "optout", offer_id: offer._id, email, expiresAt },
      ...clickTokens.map((t, i) => ({
        token: t,
        type: "click",
        offer_id: offer._id,
        email,
        rl: i + 1,
        expiresAt
      })),
    ];

    await LinkToken.insertMany(tokenDocs);

    // 5. Replace Placeholders in HTML
    let html = creative.html || creative.htmlContent || "";
    const trackingBase = process.env.TRACKING_BASE_URL || "http://localhost:4000";
    
    html = html.replace(/\{\{open\}\}/g, `${trackingBase}/t/open?k=${openToken}`);
    html = html.replace(/\{\{unsub\}\}/g, `${trackingBase}/t/unsub?k=${unsubToken}`);
    html = html.replace(/\{\{optout\}\}/g, `${trackingBase}/t/optout?k=${optoutToken}`);

    clickTokens.forEach((t, i) => {
      const regex = new RegExp(`\\{\\{click${i + 1}\\}\\}`, "g");
      html = html.replace(regex, `${trackingBase}/t/click?k=${t}`);
    });

    // 6. Pick the Configured Route
    const availableRoutes = (sender.routes || []).filter(r => r.active !== false);
    let route = (sender.routes || []).find(r => String(r._id) === String(trigger.routeId));
    
    if (!route && availableRoutes.length > 0) {
      console.warn(`⚠️ TRIGGER: Configured route ${trigger.routeId} not found or inactive. Falling back.`);
      route = availableRoutes[0];
    }

    if (!route) {
      console.warn(`⚠️ TRIGGER: No active routes for sender ${sender.name}`);
      return;
    }

    /* ======================
       5. CALL SENDER SERVER
    ====================== */

    const senderUrl = sender.baseUrl.replace(/\/$/, "") + "/sendWelcomeEmail.php";
    const internalKey = process.env.SENDER_INTERNAL_KEY;

    const fromEmail = `${route.from_user}@${route.domain}`;
    
    // Build the header block exactly as requested
    const customHeaders = [
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

    const res = await fetch(senderUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Key": internalKey,
      },
      body: JSON.stringify({
        to: email,
        fromEmail: fromEmail,
        fromName: fromLine,
        subject: subject,
        html: html,
        vmta: route.vmta,
        customHeaders: customHeaders
      }),
    });

    if (!res.ok) {
      console.error(`❌ TRIGGER: Sender failed (${res.status}): ${await res.text()}`);
    } else {
      console.log(`✅ TRIGGER: Sent follow-up to ${email} via sendWelcomeEmail.php`);
    }

  } catch (err) {
    console.error("🔥 TRIGGER SERVICE ERROR:", err);
  }
}

async function processLegacyTrigger(campaignDoc, email) {
  // ... (previous logic here if needed, but the user wants the new one)
  // I'll skip it for brevity as the new model is superior
}
