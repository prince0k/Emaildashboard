import Campaign from "../../models/Campaign.js";

export default async function updateTotalSent(req, res) {
  try {
    const internalKey = req.headers["x-internal-key"];

    if (!internalKey || internalKey !== process.env.SENDER_INTERNAL_KEY) {
      return res.status(403).json({ error: "forbidden" });
    }

    const { runtimeOfferId, count } = req.body;

    if (
      !runtimeOfferId ||
      typeof runtimeOfferId !== "string" ||
      count === undefined ||
      isNaN(count)
    ) {
      return res.status(400).json({ error: "invalid_payload" });
    }

    const increment = Number(count);

    if (increment <= 0) {
      return res.status(400).json({ error: "invalid_count" });
    }

    const result = await Campaign.updateOne(
      { runtimeOfferId: runtimeOfferId.trim() },
      {
        $inc: {
          "execution.totalSent": increment,
        },
        $set: {
          "execution.lastStatusUpdate": new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "campaign_not_found" });
    }

    return res.json({ status: "ok" });

  } catch (err) {
    console.error("UPDATE TOTAL SENT ERROR:", err);
    return res.status(500).json({ error: "update_failed" });
  }
}