import Campaign from "../../models/Campaign.js";
import OpenLog from "../../models/OpenLog.js";
import ClickLog from "../../models/ClickLog.js";
import OptoutLog from "../../models/OptoutLog.js";
import UnsubLog from "../../models/UnsubLog.js";
import LinkToken from "../../models/LinkToken.js";
import ComplaintLog from "../../models/ComplaintLog.js";
import User from "../../models/User.js";
import SenderServer from "../../models/SenderServer.js";
export default async function listCampaigns(req, res) {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      senderId,
      search,
      from,
      to,
      sortBy = "createdAt",
      order = "desc",
    } = req.query;

    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    /* =========================
       BUILD QUERY
    ========================= */

    const query = {
      isDeleted: { $ne: true }
    };
    if (status) {
      query.status = status;
    }

    if (senderId) {
      query.sender = senderId;
    }
    
    if (search) {
      query.campaignName = {
        $regex: search,
        $options: "i",
      };
    }

    if (from || to) {
      query.createdAt = {};

      if (from) {
        const fromDate = new Date(from);
        fromDate.setUTCHours(0, 0, 0, 0);
        query.createdAt.$gte = fromDate;
      }

      if (to) {
        const toDate = new Date(to);
        toDate.setUTCHours(23, 59, 59, 999);
        query.createdAt.$lte = toDate;
      }
    }

    /* =========================
       SORT CONFIG
    ========================= */

    const mongoSortableFields = [
      "createdAt",
      "campaignName",
      "status",
      "execution.totalSent",
      "execution.delivered",
    ];

    const kpiSortableFields = [
      "openRate",
      "clickRate",
      "ctr",
      "uniqueOpens",
      "uniqueClicks",
      "totalOpens",
      "totalClicks",
      "optouts",
      "unsubs",
      "createdByUserId",
      "senderServerId",
    ];

    const mongoSort = mongoSortableFields.includes(sortBy)
      ? { [sortBy]: order === "asc" ? 1 : -1 }
      : { createdAt: -1 };

    /* =========================
       FETCH CAMPAIGNS
    ========================= */

    const [campaigns, total] = await Promise.all([
      Campaign.find(query)
      .populate("createdBy", "userId email")   // 🔥 populate user
      .populate("sender", "name")  // 🔥 populate sender server
      .sort(mongoSort)
      .skip(skip)
      .limit(limitNum)
      .lean(),
      Campaign.countDocuments(query),
    ]);

    const offerIds = campaigns
      .map((c) => c.runtimeOfferId)
      .filter(Boolean);

    if (!offerIds.length) {
      const data = campaigns.map((c) => ({
        ...c,
        createdByUserId: c.createdBy?.userId || null,
        createdByEmail: c.createdBy?.email || null,
        senderServerId: c.sender?.name || null,
        kpi: {
          uniqueOpens: 0,
          totalOpens: 0,
          uniqueClicks: 0,
          totalClicks: 0,
          optouts: 0,
          unsubs: 0,
          openRate: 0,
          clickRate: 0,
          ctr: 0,
        },
      }));

      return res.json({
        data,
        pagination: {
          total,
          page: pageNum,
          pages: Math.ceil(total / limitNum),
          limit: limitNum,
        },
      });
    }

    

    /* =========================
       LOG MATCH
    ========================= */

    const openLogMatch = {
      offer_id: { $in: offerIds },
    };

    const dayStringMatch = {
      offer_id: { $in: offerIds },
    };

    if (from || to) {
      if (from) {
        const fromDate = new Date(from);
        fromDate.setUTCHours(0, 0, 0, 0);

        openLogMatch.day = {
          ...(openLogMatch.day || {}),
          $gte: fromDate,
        };

        dayStringMatch.day = {
          ...(dayStringMatch.day || {}),
          $gte: fromDate.toISOString().slice(0, 10),
        };
      }

      if (to) {
        const toDate = new Date(to);
        toDate.setUTCHours(23, 59, 59, 999);

        openLogMatch.day = {
          ...(openLogMatch.day || {}),
          $lte: toDate,
        };

        dayStringMatch.day = {
          ...(dayStringMatch.day || {}),
          $lte: toDate.toISOString().slice(0, 10),
        };
      }
    }

    /* =========================
       AGGREGATIONS
    ========================= */

const [openAgg, clickAgg, optoutAgg, unsubAgg, complaintAgg] =
  await Promise.all([

    OpenLog.aggregate([
      { $match: openLogMatch },
      {
        $group: {
          _id: "$offer_id",
          unique: { $sum: "$unique_open_count" },
          total: { $sum: "$total_open_count" },
          bots: { $sum: "$bot_open_count" },
        }
      }
    ]),

    ClickLog.aggregate([
      { $match: dayStringMatch },
      {
        $group: {
          _id: "$offer_id",
          total: { $sum: 1 },
          emails: { $addToSet: "$email" }
        }
      },
      {
        $project: {
          total: 1,
          unique: {
            $size: {
              $filter: {
                input: "$emails",
                as: "e",
                cond: { $ne: ["$$e", null] }
              }
            }
          }
        }
      }
    ]),

    OptoutLog.aggregate([
      { $match: dayStringMatch },
      {
        $group: {
          _id: "$offer_id",
          count: { $sum: 1 }
        }
      }
    ]),

    UnsubLog.aggregate([
      { $match: dayStringMatch },
      {
        $group: {
          _id: "$offer_id",
          count: { $sum: 1 }
        }
      }
    ]),

    // 🔥 FIX: complaint inside Promise.all
    ComplaintLog.aggregate([
  {
    $match: {
      offer_id: { $in: offerIds }
    }
  },
  {
    $group: {
      _id: "$offer_id",
      count: { $sum: 1 }
    }
  }
])

  ]);
    /* =========================
       MAP BUILD
    ========================= */

    /* =========================
   MAP BUILD
========================= */

// OPEN MAP (custom because 3 metrics)
const buildOpenMap = (arr) => {
  const map = {};
  arr.forEach((item) => {
    map[item._id] = {
      total: item.total || 0,
      unique: item.unique || 0,
      bots: item.bots || 0,
    };
  });
  return map;
};

// GENERIC MAP (for click, optout, unsub)
const buildMap = (arr, isUnique = false) => {
  const map = {};
  arr.forEach((item) => {
    map[item._id] = isUnique
      ? {
          total: item.total || 0,
          unique: item.unique || 0,
        }
      : item.count || 0;
  });
  return map;
};

const openMap = buildOpenMap(openAgg);
const clickMap = buildMap(clickAgg, true);
const optoutMap = buildMap(optoutAgg);
const unsubMap = buildMap(unsubAgg);
const complaintMap = buildMap(complaintAgg);
    /* =========================
       MERGE KPI
    ========================= */

    const data = campaigns.map((c) => {
      const offerId = c.runtimeOfferId;

      const openData = openMap[offerId] || {
        total: 0,
        unique: 0,
        bots: 0,
      };

      const uniqueOpens = openData.unique;
      const botOpens = openData.bots;
      const totalOpens = openData.total;
      const clickData = clickMap[offerId] || {
        total: 0,
        unique: 0,
      };
      const totalSent = c.execution?.totalSent || 0;
      const delivered = c.execution?.delivered || 0;
      const hardBounce = c.execution?.hardBounce || 0;
      const softBounce = c.execution?.softBounce || 0;
      const complaints = complaintMap[offerId] || 0;
      const totalBounce = hardBounce + softBounce;

      

      
      const uniqueClicks = clickData.unique;

      const optouts = optoutMap[offerId] || 0;
      const unsubs = unsubMap[offerId] || 0;

      /* ================= RATE CALCULATIONS ================= */

      // Industry standard
      const openRate =
        delivered > 0
          ? Number(((uniqueOpens / delivered) * 100).toFixed(2))
          : 0;

      const botRate =
        openData.total > 0
          ? Number(((botOpens / openData.total) * 100).toFixed(2))
          : 0;

      const clickRate =
        delivered > 0
          ? Number(((uniqueClicks / delivered) * 100).toFixed(2))
          : 0;

      const ctr =
        uniqueOpens > 0
          ? Number(((uniqueClicks / uniqueOpens) * 100).toFixed(2))
          : 0;

      // ✅ Correct bounce rate
      const bounceRate =
        totalSent > 0
          ? Number(((totalBounce / totalSent) * 100).toFixed(2))
          : 0;

      const hardBounceRate =
        totalSent > 0
          ? Number(((hardBounce / totalSent) * 100).toFixed(2))
          : 0;

      const softBounceRate =
        totalSent > 0
          ? Number(((softBounce / totalSent) * 100).toFixed(2))
          : 0;

      const complaintRate =
        delivered > 0
          ? Number(((complaints / delivered) * 100).toFixed(2))
          : 0;

      return {
        ...c,
        createdByUserId: c.createdBy?.userId || null,
        createdByEmail: c.createdBy?.email || null,

        senderServerId: c.sender?.name || null,

        kpi: {
          totalSent,
          delivered,
          hardBounce,
          softBounce,
          totalBounce,

          bounceRate,
          hardBounceRate,
          softBounceRate,

          uniqueOpens,
          totalOpens: openData.total,
          botOpens,
          botRate,
          uniqueClicks,
          totalClicks: clickData.total,
          optouts,
          unsubs,
          openRate,
          clickRate,
          complaints,
          complaintRate,
          ctr,
        },
      };
    });

    /* =========================
       KPI SORT (AFTER MERGE)
    ========================= */

    if (kpiSortableFields.includes(sortBy)) {
      data.sort((a, b) => {
        let aVal;
        let bVal;

        // KPI fields
        if (a.kpi?.hasOwnProperty(sortBy)) {
          aVal = a.kpi?.[sortBy] || 0;
          bVal = b.kpi?.[sortBy] || 0;
        }

        // createdByUserId
        else if (sortBy === "createdByUserId") {
          aVal = a.createdByUserId || "";
          bVal = b.createdByUserId || "";
        }

        // senderServerId
        else if (sortBy === "senderServerId") {
          aVal = a.senderServerId || "";
          bVal = b.senderServerId || "";
        }

        // fallback
        else {
          aVal = 0;
          bVal = 0;
        }

        if (typeof aVal === "string") {
          return order === "asc"
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        }

        return order === "asc"
          ? aVal - bVal
          : bVal - aVal;
      });
    }

    return res.json({
      data,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
        limit: limitNum,
      },
    });
  } catch (err) {
    console.error("LIST CAMPAIGNS ERROR:", err);
    return res.status(500).json({ error: "list_failed" });
  }
}