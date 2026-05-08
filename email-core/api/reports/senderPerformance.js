import Campaign from "../../models/Campaign.js";
import OpenLog from "../../models/OpenLog.js";
import ClickLog from "../../models/ClickLog.js";
import UnsubLog from "../../models/UnsubLog.js";
import OptoutLog from "../../models/OptoutLog.js";
import ComplaintLog from "../../models/ComplaintLog.js";

function isValidDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function keyExpr(groupBy) {
  if (groupBy === "domain") {
    return {
      $toLower: {
        $ifNull: ["$send_domain", "unknown"],
      },
    };
  }

  return {
    $toLower: {
      $ifNull: ["$vmta", "unknown"],
    },
  };
}

export default async function senderPerformance(req, res) {
  try {
    const { date, groupBy = "ip" } = req.query;

    if (!date || !isValidDate(date)) {
      return res.status(400).json({
        success: false,
        error: "Invalid date. Use YYYY-MM-DD",
      });
    }

    if (!["ip", "domain"].includes(groupBy)) {
      return res.status(400).json({
        success: false,
        error: "groupBy must be either ip or domain",
      });
    }

    const start = new Date(`${date}T00:00:00.000Z`);
    const end = new Date(`${date}T23:59:59.999Z`);

    const campaignKey =
      groupBy === "domain"
        ? {
            $toLower: {
              $ifNull: [{ $arrayElemAt: ["$routes.domain", 0] }, "unknown"],
            },
          }
        : {
            $toLower: {
              $ifNull: [{ $arrayElemAt: [{ $split: ["$runtimeOfferId", "_"] }, 0] }, "unknown"],
            },
          };

    const [campaignAgg, openAgg, clickAgg, unsubAgg, optoutAgg, complaintAgg] =
      await Promise.all([
        Campaign.aggregate([
          {
            $match: {
              createdAt: { $gte: start, $lte: end },
              isDeleted: { $ne: true },
            },
          },
          {
            $group: {
              _id: campaignKey,
              sent: { $sum: { $ifNull: ["$execution.totalSent", 0] } },
              delivered: { $sum: { $ifNull: ["$execution.delivered", 0] } },
              bounce: {
                $sum: {
                  $add: [
                    { $ifNull: ["$execution.hardBounce", 0] },
                    { $ifNull: ["$execution.softBounce", 0] },
                  ],
                },
              },
            },
          },
        ]),

        OpenLog.aggregate([
          {
            $match: {
              day: { $gte: start, $lte: end },
            },
          },
          {
            $group: {
              _id: keyExpr(groupBy),
              open: { $sum: { $ifNull: ["$total_open_count", 0] } },
            },
          },
        ]),

        ClickLog.aggregate([
          {
            $match: {
              day: date,
              is_bot_click: false,
            },
          },
          {
            $group: {
              _id: keyExpr(groupBy),
              click: { $sum: 1 },
            },
          },
        ]),

        UnsubLog.aggregate([
          { $match: { day: date } },
          {
            $group: {
              _id: keyExpr(groupBy),
              unsub: { $sum: 1 },
            },
          },
        ]),

        OptoutLog.aggregate([
          { $match: { day: date } },
          {
            $group: {
              _id: keyExpr(groupBy),
              optout: { $sum: 1 },
            },
          },
        ]),

        ComplaintLog.aggregate([
          { $match: { day: date } },
          {
            $lookup: {
              from: "campaigns",
              localField: "offer_id",
              foreignField: "runtimeOfferId",
              as: "campaign",
            },
          },
          {
            $unwind: {
              path: "$campaign",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $group: {
              _id:
                groupBy === "domain"
                  ? {
                      $toLower: {
                        $ifNull: [{ $arrayElemAt: ["$campaign.routes.domain", 0] }, "unknown"],
                      },
                    }
                  : {
                      $toLower: {
                        $ifNull: [{ $arrayElemAt: [{ $split: ["$offer_id", "_"] }, 0] }, "unknown"],
                      },
                    },
              complaint: { $sum: 1 },
            },
          },
        ]),
      ]);

    const map = new Map();

    const apply = (rows, field) => {
      for (const row of rows) {
        const key = row?._id || "unknown";
        if (!map.has(key)) {
          map.set(key, {
            key,
            sent: 0,
            delivered: 0,
            open: 0,
            click: 0,
            unsub: 0,
            optout: 0,
            complaint: 0,
            bounce: 0,
          });
        }

        map.get(key)[field] = row?.[field] || 0;
      }
    };

    apply(campaignAgg, "sent");
    apply(campaignAgg, "delivered");
    apply(campaignAgg, "bounce");
    apply(openAgg, "open");
    apply(clickAgg, "click");
    apply(unsubAgg, "unsub");
    apply(optoutAgg, "optout");
    apply(complaintAgg, "complaint");

    const data = [...map.values()].sort((a, b) => b.delivered - a.delivered);

    return res.json({
      success: true,
      date,
      groupBy,
      count: data.length,
      data,
    });
  } catch (error) {
    console.error("senderPerformance error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to load sender performance",
    });
  }
}