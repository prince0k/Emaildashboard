import Campaign from "../../models/Campaign.js";

export default async function updateStatusPublic(req, res) {
  try {
    /* ===============================
       1️⃣ INTERNAL KEY VALIDATION
    =============================== */

    const internalKey = req.headers["x-internal-key"];

    // ✅ Single global key
    if (!internalKey || internalKey !== process.env.SENDER_INTERNAL_KEY) {
      return res.status(403).json({ error: "forbidden" });
    }

    /* ===============================
       2️⃣ INPUT VALIDATION
    =============================== */

    const runtimeOfferId = req.body.runtimeOfferId?.trim();
    const status = req.body.status?.trim();

    if (!runtimeOfferId || !status) {
      return res.status(400).json({ error: "invalid_input" });
    }

    const allowedStatuses = [
      "RUNNING",
      "PAUSED",
      "STOPPED",
      "COMPLETED",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ error: "invalid_status" });
    }

    /* ===============================
       3️⃣ FIND CAMPAIGN
    =============================== */

    const campaignDoc = await Campaign.findOne({ runtimeOfferId });

    if (!campaignDoc) {
      return res.status(404).json({ error: "campaign_not_found" });
    }

    /* ===============================
       4️⃣ STATE TRANSITION CHECK
    =============================== */

    const current = campaignDoc.status;

    const validTransitions = {
      DEPLOYED: ["RUNNING"],
      RUNNING: ["PAUSED", "STOPPED", "COMPLETED"],
      PAUSED: ["RUNNING", "STOPPED"],
      STOPPED: [],
      COMPLETED: [],
    };

    if (!validTransitions[current]?.includes(status)) {
      return res.status(400).json({ error: "invalid_transition" });
    }

    /* ===============================
       5️⃣ UPDATE STATUS
    =============================== */

    campaignDoc.status = status;

    campaignDoc.execution = campaignDoc.execution || {};
    campaignDoc.execution.lastStatusUpdate = new Date();

    if (status === "COMPLETED") {
      campaignDoc.execution.completedAt = new Date();
    }

    await campaignDoc.save();

    return res.json({ status: "updated" });

  } catch (err) {
    console.error("UpdateStatus error:", err);
    return res.status(500).json({ error: "update_failed" });
  }
}