import OpenLog from "../../models/OpenLog.js";
import auth from "../../middleware/auth.js";
import checkPermission from "../../middleware/checkPermission.js";

/*
  OPEN REPORT — SECURE VERSION
*/

export default [
  auth,
  checkPermission("reports.view"),
  async function openReport(req, res) {
    try {
      const { from, to, offer_id } = req.query;

      if (!from || !to) {
        return res.status(400).json({
          error: "from_and_to_required",
        });
      }

      if (!/^\d{4}-\d{2}-\d{2}$/.test(from) ||
          !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
        return res.status(400).json({
          error: "invalid_date_format_use_yyyy_mm_dd",
        });
      }

      const match = {
        day: {
          $gte: new Date(from),
          $lte: new Date(to + "T23:59:59.999Z"),
        }
      };

      if (offer_id) {
        match.offer_id = String(offer_id);
      }

const data = await OpenLog.aggregate([
  { $match: match },

  {
    $group: {
      _id: "$offer_id",

      total_opens: { $sum: "$total_open_count" },

      unique_opens: { $sum: "$unique_open_count" },

      bot_opens: { $sum: "$bot_open_count" }
    }
  },

  {
    $project: {
      offer_id: "$_id",
      total_opens: 1,
      unique_opens: 1,
      bot_opens: 1,

      human_opens: {
        $subtract: ["$total_opens", "$bot_opens"]
      },

      bot_rate: {
        $cond: [
          { $gt: ["$total_opens", 0] },
          {
            $round: [
              {
                $multiply: [
                  { $divide: ["$bot_opens", "$total_opens"] },
                  100
                ]
              },
              2
            ]
          },
          0
        ]
      }
    }
  },

  { $sort: { total_opens: -1 } }
]);

      return res.json({
        from,
        to,
        offers: data,
      });

    } catch (err) {
      console.error("OPEN REPORT ERROR:", err);
      return res.status(500).json({
        error: "server_error",
      });
    }
  },
];