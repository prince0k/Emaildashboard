import Campaign from "../../models/Campaign.js";

export default async function analytics(req, res) {

  try {

    const totalCampaigns = await Campaign.countDocuments();

    const running = await Campaign.countDocuments({ status: "RUNNING" });
    const paused = await Campaign.countDocuments({ status: "PAUSED" });
    const scheduled = await Campaign.countDocuments({ status: "SCHEDULED" });
    const completed = await Campaign.countDocuments({ status: "COMPLETED" });

    const campaigns = await Campaign.find({}, { execution: 1 }).lean();

    let totalSent = 0;
    let totalDelivered = 0;

    for (const c of campaigns) {

      if (c.execution) {

        totalSent += Number(c.execution.totalSent || 0);
        totalDelivered += Number(
          c.execution.totalDelivered ||
          c.execution.delivered ||
          0
        );

      }

    }

    res.json({
      totalCampaigns,
      running,
      paused,
      scheduled,
      completed,
      totalSent,
      totalDelivered
    });

  } catch (err) {

    console.error("ANALYTICS ERROR:", err);

    res.status(503).json({
      error: "analytics_failed",
      message: err.message
    });

  }

}