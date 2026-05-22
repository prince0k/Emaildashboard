import express from "express";
import Lead from "../../models/Lead.js";
import auth from "../../middleware/auth.js";
import checkPermission from "../../middleware/checkPermission.js";

const router = express.Router();

router.get("/stats", auth, checkPermission("reports.view"), async (req, res) => {
  try {
    const { from, to } = req.query;

    const filter = {};
    if (from && to) {
      filter.createdAt = {
        $gte: new Date(from),
        $lte: new Date(to + "T23:59:59.999Z"),
      };
    }

    const totalLeads = await Lead.countDocuments(filter);
    
    const statusCounts = await Lead.aggregate([
      { $match: filter },
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    const siteCounts = await Lead.aggregate([
      { $match: filter },
      { $group: { _id: "$siteName", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const recentLeads = await Lead.find(filter)
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return res.json({
      totalLeads,
      statusCounts: statusCounts.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {}),
      siteCounts,
      recentLeads,
    });
  } catch (err) {
    console.error("🔥 LEAD STATS ERROR:", err);
    return res.status(500).json({ error: "failed_to_fetch_lead_stats" });
  }
});

export default router;
