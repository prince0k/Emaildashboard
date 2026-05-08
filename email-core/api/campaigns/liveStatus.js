import Campaign from "../../models/Campaign.js";
import axios from "axios";
import SenderServer from "../../models/SenderServer.js";

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
    const lastUpdate = campaign.execution?.lastStatusUpdate || null;

const totalPlanned = campaign.sendConfig?.totalSend || 0;

    const progress =
      totalPlanned > 0
        ? Number(((sent / totalPlanned) * 100).toFixed(2))
        : 0;

    /* =====================================================
   FETCH LIVE STATUS FROM CAMPAIGN'S SENDER
    ===================================================== */

    const senderDoc = await SenderServer.findOne({
      _id: campaign.sender,
      active: true,
    }).lean();

    if (!senderDoc) {
      return res.json({
        campaign: {
          id: campaign._id,
          name: campaign.campaignName,
          runtimeOfferId: runtimeId,
        },
        status: campaign.status || "UNKNOWN",
        sender: null,
        live: {
          sent,
          delivered,
          failures,
          progress,
          lastUpdate,
        },
      });
    }

    const baseUrl = senderDoc.baseUrl.replace(/\/$/, "");
    const statusUrl = `${baseUrl}/internal/campaigns/${campaign.campaignName}/status.json`;

    let senderStatus = campaign.status || "UNKNOWN";

    try {
      const response = await axios.get(statusUrl, {
        timeout: 2000,
        validateStatus: () => true,
      });

      if (response.status === 200 && response.data?.status) {
        senderStatus = response.data.status;
      }
    } catch {
      // ignore failure — fallback to DB
    }
    if (campaign.status !== senderStatus) {
      await Campaign.updateOne(
        { _id: campaign._id, status: { $ne: senderStatus } },
        { $set: { status: senderStatus } }
      );
    }
    /* =====================================================
       RESPONSE
    ===================================================== */

    return res.json({
      campaign: {
        id: campaign._id,
        name: campaign.campaignName,
        runtimeOfferId: runtimeId,
      },

      status: senderStatus,
      sender: senderDoc.code || senderDoc.name,

      live: {
        sent,
        delivered,
        failures,
        progress,
        lastUpdate,
      }
    });

  } catch (err) {
    console.error("LIVE STATUS ERROR:", err.message);
    return res.status(500).json({ error: "live_status_failed" });
  }
}
