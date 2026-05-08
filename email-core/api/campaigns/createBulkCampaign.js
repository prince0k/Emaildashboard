export default async function createBulkCampaign(req, res) {
  try {
    const { campaigns, scheduledDate } = req.body;

    if (!Array.isArray(campaigns) || campaigns.length === 0) {
      return res.status(400).json({ error: "campaigns_required" });
    }

    const results = [];

    for (const c of campaigns) {
      try {
        const fakeReq = {
          ...req,
          body: {
            ...c,
            scheduledDate
          }
        };

        const fakeRes = {
          status: () => fakeRes,
          json: (data) => {
            results.push({ success: true, data });
          }
        };

        await createCampaign(fakeReq, fakeRes);

      } catch (err) {
        results.push({
          success: false,
          error: err.message
        });
      }
    }

    return res.json({
      status: "bulk_completed",
      total: campaigns.length,
      results
    });

  } catch (err) {
    return res.status(500).json({
      error: "bulk_failed",
      message: err.message
    });
  }
}