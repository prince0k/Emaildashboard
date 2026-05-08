import Campaign from "../../models/Campaign.js";
import OpenLog from "../../models/OpenLog.js";
import ClickLog from "../../models/ClickLog.js";
import OptoutLog from "../../models/OptoutLog.js";
import UnsubLog from "../../models/UnsubLog.js";

export default async function campaignAnalytics(req, res) {
  try {
    const campaignName = req.params.campaign?.trim();
    if (!campaignName)
      return res.status(400).json({ error: "campaign_id_required" });

    const campaign = await Campaign.findOne({ campaignName });
    if (!campaign)
      return res.status(404).json({ error: "campaign_not_found" });

    const offerId = campaign.runtimeOfferId;
    if (!offerId)
      return res.status(400).json({ error: "runtime_offer_missing" });

    const totalSent = campaign.execution?.totalSent || 0;
    const delivered = campaign.execution?.delivered || 0;

    /* =====================================================
       PARALLEL DATA FETCH
    ===================================================== */

    const [
      totalOpens,
      totalClicks,
      optouts,
      unsubs,
      lifetimeEmailOpens,
      lifetimeTokenOpens,
      lifetimeEmailClicks
    ] = await Promise.all([

      // Per-day unique (each document = unique per rule)
      OpenLog.countDocuments({ offer_id: offerId }),
      ClickLog.countDocuments({ offer_id: offerId }),

      OptoutLog.countDocuments({ offer_id: offerId }),
      UnsubLog.countDocuments({ offer_id: offerId }),

      // Lifetime unique opens (email based)
      OpenLog.distinct("email", {
        offer_id: offerId,
        email: { $ne: null }
      }),

      // Lifetime unique opens (token based)
      OpenLog.distinct("token", {
        offer_id: offerId,
        token: { $ne: null }
      }),

      // Lifetime unique clicks (email based)
      ClickLog.distinct("email", {
        offer_id: offerId,
        email: { $ne: null }
      }),
    ]);

    const lifetimeUniqueOpens =
      lifetimeEmailOpens.length + lifetimeTokenOpens.length;

    const lifetimeUniqueClicks =
      lifetimeEmailClicks.length;

    /* =====================================================
       RATES
    ===================================================== */

    const deliveryRate =
      totalSent > 0 ? +((delivered / totalSent) * 100).toFixed(2) : 0;

    const openRate =
      delivered > 0
        ? +((lifetimeUniqueOpens / delivered) * 100).toFixed(2)
        : 0;

    const clickRate =
      delivered > 0
        ? +((lifetimeUniqueClicks / delivered) * 100).toFixed(2)
        : 0;

    const ctr =
      lifetimeUniqueOpens > 0
        ? +((lifetimeUniqueClicks / lifetimeUniqueOpens) * 100).toFixed(2)
        : 0;

    /* =====================================================
       RESPONSE
    ===================================================== */

    return res.json({
      sending: {
        totalSent,
        delivered,
        deliveryRate,
      },

      tracking: {
        // Lifetime Unique
        uniqueOpens: lifetimeUniqueOpens,
        uniqueClicks: lifetimeUniqueClicks,

        // Per-Day Unique (document count)
        totalOpens,
        totalClicks,

        openRate,
        clickRate,
        ctr,

        optouts,
        unsubs,
        complaints: 0,
      },

      meta: {
        status: campaign.status,
      },
    });
  } catch (err) {
    console.error("CAMPAIGN ANALYTICS ERROR:", err);
    return res.status(500).json({ error: "analytics_failed" });
  }
}