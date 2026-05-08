import ClickLog from "../../models/ClickLog.js";
import auth from "../../middleware/auth.js";
import checkPermission from "../../middleware/checkPermission.js";

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

      return res.json({
        start,
        end,
        offers: data.map((o) => ({
          offer_id: o._id,
          total_clicks: o.total_clicks,
          unique_clicks: o.unique_clicks,
          links: o.links,
        })),
      });

    } catch (err) {
      console.error("CLICK REPORT ERROR:", err);
      return res.status(500).json({
        error: "server_error",
      });
    }
  },
];