import fs from "fs";
import path from "path";
import readline from "readline";
import axios from "axios";
import Campaign from "../models/Campaign.js";
import SubjectLine from "../models/SubjectLine.js";
import FromLine from "../models/FromLine.js";
import Creative from "../models/Creative.js";
import SenderServer from "../models/SenderServer.js";

const DATA_ROOT = process.env.DATA_ROOT || "D:/recipe/Emaildashboard/email-core-data";

/* ======================
   REAL-TIME SUPPRESSION HELPERS
====================== */

function loadSuppressionSet(filePath) {
  const set = new Set();
  if (!filePath) return set;
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf-8");
      for (const line of content.split("\n")) {
        const email = line.trim().toLowerCase();
        if (email) set.add(email);
      }
    }
  } catch (e) {
    console.error("Failed to load suppression file:", filePath, e.message);
  }
  return set;
}

function extractEmailFromLine(line) {
  if (!line) return null;
  const trimmed = line.trim();
  if (!trimmed) return null;
  if (trimmed.includes("|")) {
    const parts = trimmed.split("|");
    return (parts[1] || "").trim().toLowerCase() || null;
  }
  return trimmed.toLowerCase();
}

/**
 * campaignSenderWorker.js
 * FULLY TRANSACTIONAL — Parallel Chunked execution for high scale.
 */
export async function startCampaignWorker(campaignId) {
  try {
    const campaignDoc = await Campaign.findById(campaignId);
    if (!campaignDoc) return;

    if (campaignDoc.status !== "RUNNING") return;

    // Load assets
    const sender = await SenderServer.findById(campaignDoc.sender);
    const creative = await Creative.findById(campaignDoc.creativeId);
    const subjects = await SubjectLine.find({ _id: { $in: campaignDoc.sendConfig?.subjectIds || [] } });
    const fromLines = await FromLine.find({ _id: { $in: campaignDoc.sendConfig?.fromIds || [] } });

    if (!sender) {
      campaignDoc.status = "FAILED";
      await campaignDoc.save();
      return;
    }

    const segmentPath = path.join(DATA_ROOT, "output", campaignDoc.suppression?.outputFile);

    if (!fs.existsSync(segmentPath)) {
      console.error("Segment file not found:", segmentPath);
      campaignDoc.status = "FAILED";
      await campaignDoc.save();
      return;
    }

    /* ===== REAL-TIME SUPPRESSION: LOAD SETS ===== */
    const suppConfig = campaignDoc.suppressionConfig || {};
    const skipUnsub = suppConfig.skipUnsub === true;
    let queueDomain = suppConfig.queueDomain || null;

    if (!queueDomain && campaignDoc.routes?.length > 0) {
      queueDomain = campaignDoc.routes[0].domain?.toLowerCase() || null;
    }

    const complaintGlobalPath = path.join(DATA_ROOT, "complaint", "complaint.txt");
    const complaintDomainPath = queueDomain
      ? path.join(DATA_ROOT, "complaint", "domain", `${queueDomain}.txt`)
      : null;
    const unsubGlobalPath = path.join(DATA_ROOT, "unsubscribe", "unsub.txt");
    const unsubDomainPath = queueDomain
      ? path.join(DATA_ROOT, "unsubscribe", "domain", `${queueDomain}.txt`)
      : null;

    let complaintSet = new Set([
      ...loadSuppressionSet(complaintGlobalPath),
      ...loadSuppressionSet(complaintDomainPath),
    ]);

    let unsubSet = skipUnsub ? new Set() : new Set([
      ...loadSuppressionSet(unsubGlobalPath),
      ...loadSuppressionSet(unsubDomainPath),
    ]);

    console.log(`🛡️ Real-time suppression loaded: ${complaintSet.size} complaints, ${unsubSet.size} unsubs`);

    const RELOAD_INTERVAL_MS = 5 * 60 * 1000;
    let lastReload = Date.now();

    const reloadSets = () => {
      complaintSet = new Set([
        ...loadSuppressionSet(complaintGlobalPath),
        ...loadSuppressionSet(complaintDomainPath),
      ]);
      unsubSet = skipUnsub ? new Set() : new Set([
        ...loadSuppressionSet(unsubGlobalPath),
        ...loadSuppressionSet(unsubDomainPath),
      ]);
      lastReload = Date.now();
      console.log(`🔄 Suppression sets reloaded: ${complaintSet.size} complaints, ${unsubSet.size} unsubs`);
    };

    /* ===== DB STATUS POLLING CONFIG ===== */
    async function checkCampaignStatus() {
      try {
        const live = await Campaign.findById(campaignId).select("status").lean();
        return live?.status || "UNKNOWN";
      } catch {
        return "RUNNING";
      }
    }

    /* ===== START SENDING ===== */
    const fileStream = fs.createReadStream(segmentPath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });

    let sentCount = 0;
    let deliveredCount = 0;
    let failuresCount = 0;
    let realtimeSuppressed = 0;
    const totalToSend = campaignDoc.sendConfig?.totalSend || 0;
    
    // Throttling logic
    const sendInSeconds = campaignDoc.sendConfig?.sendInSeconds || 
                          (campaignDoc.sendConfig?.sendInMinutes ? campaignDoc.sendConfig?.sendInMinutes * 60 : 0) ||
                          (campaignDoc.sendConfig?.sendInHours ? campaignDoc.sendConfig?.sendInHours * 3600 : 0);
    
    const delayPerMailMs = sendInSeconds > 0 ? (sendInSeconds * 1000) / totalToSend : 0;
    // Dynamic chunk size based on target send rate to prevent network latency throttling
    const targetRatePerSec = sendInSeconds > 0 ? (totalToSend / sendInSeconds) : 0;
    let CHUNK_SIZE = 50; // default chunk size
    if (targetRatePerSec > 100) {
      // Scale chunk size assuming ~200ms average request round-trip latency
      CHUNK_SIZE = Math.min(1000, Math.max(50, Math.ceil(targetRatePerSec * 0.2)));
    }

    console.log(`🚀 Starting Parallel Bulk Sender for ${campaignDoc.campaignName}. Total: ${totalToSend}. Delay: ${delayPerMailMs}ms. Chunk Size: ${CHUNK_SIZE}`);

    const senderUrl = sender.baseUrl.replace(/\/$/, "") + "/sendWelcomeEmail.php";
    const internalKey = process.env.SENDER_INTERNAL_KEY;

    let chunk = [];
    let lastDbUpdate = Date.now();
    const DB_UPDATE_INTERVAL_MS = 4000; // 4 seconds

    // Helper to process a chunk
    const processChunk = async (currentChunk) => {
      if (currentChunk.length === 0) return;

      const chunkStart = Date.now();

      // Parallel execution of the chunk with staggered delay pacing
      await Promise.allSettled(currentChunk.map(async (email, index) => {
        if (delayPerMailMs > 0 && index > 0) {
          await new Promise(resolve => setTimeout(resolve, Math.round(index * delayPerMailMs)));
        }

        // Rotate assets
        const subject = subjects.length > 0 
          ? subjects[Math.floor(Math.random() * subjects.length)].text 
          : "Standard Subject";
        
        const fromLine = fromLines.length > 0 
          ? fromLines[Math.floor(Math.random() * fromLines.length)].text 
          : "Standard From";

        const route = campaignDoc.routes.length > 0
          ? campaignDoc.routes[Math.floor(Math.random() * campaignDoc.routes.length)]
          : null;

        if (!route) { failuresCount++; return; }

        const payload = {
          to: email,
          fromEmail: `${route.from_user}@${route.domain}`,
          fromName: fromLine,
          subject: subject,
          html: campaignDoc.htmlOverride || creative?.html || "<h1>No Content</h1>",
          vmta: route.vmta,
          customHeaders: campaignDoc.sendConfig?.headerBlockMode === "custom" 
            ? campaignDoc.sendConfig.customHeaderBlock.trim().replace(/\r?\n/g, "\r\n")
            : [
                "Date: {date}",
                "From: {fromName} <{fromEmail}>",
                "To: <{to}>",
                "Reply-To: {fromEmail}",
                "Subject: {subject}",
                "Message-ID: {mid}",
                "MIME-Version: 1.0",
                "List-Unsubscribe: <{listUnsubUrl}>",
                "List-Unsubscribe-Post: List-Unsubscribe=One-Click",
                "Content-Type: multipart/alternative; boundary=\"{boundary}\"",
                "X-virtual-MTA: {vmta}",
              ].join("\r\n"),
          textEncoding: campaignDoc.sendConfig?.textEncoding || "base64",
          htmlEncoding: campaignDoc.sendConfig?.htmlEncoding || "base64"
        };

        try {
          await axios.post(senderUrl, payload, {
            headers: { "X-Internal-Key": internalKey },
            timeout: 8000 // slightly longer timeout for parallel
          });
          deliveredCount++;
        } catch (err) {
          failuresCount++;
        }
      }));

      // Throttling
      const expectedTimeForChunk = delayPerMailMs * currentChunk.length;
      const elapsed = Date.now() - chunkStart;
      const sleepTime = expectedTimeForChunk - elapsed;

      if (sleepTime > 0) {
        await new Promise(resolve => setTimeout(resolve, sleepTime));
      }

      // Batch DB Update every N seconds
      if (Date.now() - lastDbUpdate > DB_UPDATE_INTERVAL_MS) {
        lastDbUpdate = Date.now();
        const liveStatus = await checkCampaignStatus();

        if (liveStatus === "PAUSED") {
          console.log(`⏸️ Campaign PAUSED. Waiting...`);
          while (true) {
            await new Promise(resolve => setTimeout(resolve, 3000));
            const resumeStatus = await checkCampaignStatus();
            if (resumeStatus === "RUNNING") break;
            if (resumeStatus === "STOPPED" || resumeStatus === "FAILED") return "STOP_WORKER";
          }
        } else if (liveStatus === "STOPPED" || liveStatus === "FAILED") {
           return "STOP_WORKER";
        }

        await Campaign.updateOne(
          { _id: campaignId },
          { $set: { 
            "execution.totalSent": sentCount,
            "execution.delivered": deliveredCount,
            "execution.failures": failuresCount,
            "execution.realtimeSuppressed": realtimeSuppressed 
          } }
        );
      }

      return "CONTINUE";
    };

    for await (const line of rl) {
      if (sentCount >= totalToSend) break;

      const email = extractEmailFromLine(line);
      if (!email) continue;

      if (Date.now() - lastReload > RELOAD_INTERVAL_MS) {
        reloadSets();
      }

      if (complaintSet.has(email) || unsubSet.has(email)) {
        realtimeSuppressed++;
        continue;
      }

      chunk.push(email);
      sentCount++; // We count it as processed

      if (chunk.length >= CHUNK_SIZE) {
        const signal = await processChunk(chunk);
        chunk = []; // reset chunk
        if (signal === "STOP_WORKER") break;
      }
    }

    // Process remainder
    if (chunk.length > 0 && sentCount <= totalToSend) {
      await processChunk(chunk);
    }

    // Final status update
    await Campaign.updateOne(
      { _id: campaignId },
      { $set: { 
        status: "COMPLETED",
        "execution.totalSent": sentCount,
        "execution.delivered": deliveredCount,
        "execution.failures": failuresCount,
        "execution.realtimeSuppressed": realtimeSuppressed,
        "execution.completedAt": new Date(),
      } }
    );

    console.log(`✅ Campaign ${campaignDoc.campaignName} finished. Sent: ${sentCount}, Delivered: ${deliveredCount}, Failures: ${failuresCount}, RT-Suppressed: ${realtimeSuppressed}`);

  } catch (err) {
    console.error("CAMPAIGN WORKER FATAL ERROR:", err);
    await Campaign.updateOne({ _id: campaignId }, { $set: { status: "FAILED" } });
  }
}
