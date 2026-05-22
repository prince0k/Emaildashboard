import Campaign from "../../models/Campaign.js";
import SenderServer from "../../models/SenderServer.js";

/**
 * liveStatus.js
 * FULLY TRANSACTIONAL — reads all status from MongoDB only.
 * No sender filesystem status.json calls.
 */
export default async function liveStatus(req, res) {
  try {
    const { id, runtimeOfferId } = req.query;

    if (!id && !runtimeOfferId) {
      return res.status(400).json({ error: "campaign_id_required" });
    }

    /* =====================================================
       FETCH CAMPAIGN
    ===================================================== */

    let campaign;

    if (id) {
      campaign = await Campaign.findById(id).lean();
    } else {
      campaign = await Campaign.findOne({ runtimeOfferId }).lean();
    }

    if (!campaign) {
      return res.status(404).json({ error: "campaign_not_found" });
    }

    const runtimeId = campaign.runtimeOfferId;

    /* =====================================================
       BASIC EXECUTION STATS (FAST)
    ===================================================== */

    const sent = campaign.execution?.totalSent || 0;
    const delivered = campaign.execution?.delivered || 0;
    const failures = campaign.execution?.failures || 0;
    const realtimeSuppressed = campaign.execution?.realtimeSuppressed || 0;
    const lastUpdate = campaign.execution?.lastStatusUpdate || null;

    const totalPlanned = campaign.sendConfig?.totalSend || 0;

    const progress =
      totalPlanned > 0
        ? Number(((sent / totalPlanned) * 100).toFixed(2))
        : 0;

    /* =====================================================
       RESOLVE SENDER NAME
    ===================================================== */

    const senderDoc = campaign.sender
      ? await SenderServer.findById(campaign.sender).select("code name").lean()
      : null;

    /* =====================================================
       RESPONSE — All data from MongoDB
    ===================================================== */

    return res.json({
      campaign: {
        id: campaign._id,
        name: campaign.campaignName,
        runtimeOfferId: runtimeId,
      },

      status: campaign.status || "UNKNOWN",
      sender: senderDoc?.code || senderDoc?.name || null,

      live: {
        sent,
        delivered,
        failures,
        realtimeSuppressed,
        progress,
        lastUpdate,
      }
    });

  } catch (err) {
    console.error("LIVE STATUS ERROR:", err.message);
    return res.status(500).json({ error: "live_status_failed" });
  }
}
