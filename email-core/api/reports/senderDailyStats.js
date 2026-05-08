import { getSenderDailyStats } from "../../services/senderStatsService.js";

function isValidDate(str) {
  return /^\d{4}-\d{2}-\d{2}$/.test(str);
}

export default async function handler(req, res) {
  try {

    const { days, from, to } = req.query;

    let options = {};

    /* =========================
       DAYS MODE
    ========================= */

    if (days) {

      const n = parseInt(days, 10);

      if (isNaN(n) || n <= 0 || n > 90) {
        return res.status(400).json({
          success: false,
          error: "Invalid days parameter"
        });
      }

      options.days = n;

    }

    /* =========================
       DATE RANGE MODE
    ========================= */

    if (from || to) {

      if (!isValidDate(from) || !isValidDate(to)) {
        return res.status(400).json({
          success: false,
          error: "Invalid date format. Use YYYY-MM-DD"
        });
      }

      options.from = from;
      options.to = to;
    }

    /* =========================
       FETCH STATS
    ========================= */

    const stats = await getSenderDailyStats(options);

    return res.json({
      success: true,
      count: stats.length,
      data: stats
    });

  } catch (err) {

    console.error("Sender stats error:", err);

    return res.status(500).json({
      success: false,
      error: "Failed to load sender stats"
    });

  }
}