import ClickLog from "../../models/ClickLog.js";
import auth from "../../middleware/auth.js";
import checkPermission from "../../middleware/checkPermission.js";
import { isClickHouseEnabled, queryLogs } from "../../config/clickhouse.js";

/*
  CLICK REPORT — SECURE VERSION
*/
export default [
  auth,
  checkPermission("reports.view"),
  async function clickReport(req, res) {
    try {
      const { start, end, offer_id } = req.query;

      if (!start || !end) {
        return res.status(400).json({
          error: "start_and_end_required",
        });
      }

      if (!/^\d{4}-\d{2}-\d{2}$/.test(start) ||
          !/^\d{4}-\d{2}-\d{2}$/.test(end)) {
        return res.status(400).json({
          error: "invalid_date_format_use_yyyy_mm_dd",
        });
      }

      if (start > end) {
        return res.status(400).json({
          error: "start_date_cannot_be_after_end",
        });
      }

      let offersData = [];

      if (isClickHouseEnabled) {
        let sql = `
          SELECT 
            offer_id,
            rl,
            count() AS total_clicks,
            uniq(email) AS unique_clicks
          FROM clicks
          WHERE day >= {start: String} AND day <= {end: String} AND bot = 0
        `;
        const params = { start, end };
        if (offer_id) {
          sql += " AND offer_id = {offer_id: String}";
          params.offer_id = String(offer_id);
        }
        sql += " GROUP BY offer_id, rl";

        const rows = await queryLogs(sql, params);
        
        // Group by offer_id in JS
        const grouped = {};
        for (const row of rows) {
          const oid = row.offer_id;
          if (!grouped[oid]) {
            grouped[oid] = {
              offer_id: oid,
              total_clicks: 0,
              unique_clicks: 0,
              links: []
            };
          }
          const tot = Number(row.total_clicks);
          const uniq = Number(row.unique_clicks);
          grouped[oid].total_clicks += tot;
          grouped[oid].unique_clicks += uniq;
          grouped[oid].links.push({
            rl: Number(row.rl),
            total_clicks: tot,
            unique_clicks: uniq
          });
        }
        offersData = Object.values(grouped);
      } else {
        const match = {
          day: { $gte: start, $lte: end },
        };

        if (offer_id) {
          match.offer_id = String(offer_id);
        }

        const data = await ClickLog.aggregate([
          { 
            $match: { 
              ...match,
              is_bot_click: false
            } 
          },
          {
            $group: {
              _id: { offer_id: "$offer_id", rl: "$rl" },
              total_clicks: { $sum: "$click_count" },
              unique_clicks: { $sum: 1 }
            }
          },
          {
            $group: {
              _id: "$_id.offer_id",
              total_clicks: { $sum: "$total_clicks" },
              unique_clicks: { $sum: "$unique_clicks" },
              links: {
                $push: {
                  rl: "$_id.rl",
                  total_clicks: "$total_clicks",
                  unique_clicks: "$unique_clicks"
                }
              }
            }
          }
        ]);
        offersData = data.map((o) => ({
          offer_id: o._id,
          total_clicks: o.total_clicks,
          unique_clicks: o.unique_clicks,
          links: o.links,
        }));
      }

      return res.json({
        start,
        end,
        offers: offersData,
      });

    } catch (err) {
      console.error("CLICK REPORT ERROR:", err);
      return res.status(500).json({
        error: "server_error",
      });
    }
  },
];