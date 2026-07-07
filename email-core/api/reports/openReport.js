import OpenLog from "../../models/OpenLog.js";
import auth from "../../middleware/auth.js";
import checkPermission from "../../middleware/checkPermission.js";
import { isClickHouseEnabled, queryLogs } from "../../config/clickhouse.js";

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

      let offersData = [];

      if (isClickHouseEnabled) {
        let sql = `
          SELECT 
            offer_id,
            count() AS total_opens,
            uniq(email) AS unique_opens,
            sum(bot) AS bot_opens
          FROM opens
          WHERE day >= {from: String} AND day <= {to: String}
        `;
        const params = { from, to };
        if (offer_id) {
          sql += " AND offer_id = {offer_id: String}";
          params.offer_id = String(offer_id);
        }
        sql += " GROUP BY offer_id ORDER BY total_opens DESC";

        const rows = await queryLogs(sql, params);
        offersData = rows.map(r => {
          const total = Number(r.total_opens);
          const bot = Number(r.bot_opens);
          const unique = Number(r.unique_opens);
          return {
            offer_id: r.offer_id,
            total_opens: total,
            unique_opens: unique,
            bot_opens: bot,
            human_opens: total - bot,
            bot_rate: total > 0 ? Number(((bot / total) * 100).toFixed(2)) : 0
          };
        });
      } else {
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
        offersData = data;
      }

      return res.json({
        from,
        to,
        offers: offersData,
      });

    } catch (err) {
      console.error("OPEN REPORT ERROR:", err);
      return res.status(500).json({
        error: "server_error",
      });
    }
  },
];