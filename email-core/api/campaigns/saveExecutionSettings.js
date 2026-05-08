import Campaign from "../../models/Campaign.js";
import { buildRoutes } from "./helpers/buildRoutes.js";

export default async function saveExecutionSettings(req, res) {
  try {
    const campaign = decodeURIComponent(req.params.campaign).trim();
     const { routes, ...config } = req.body || {};

    if (!req.user?.mongoId) {
      return res.status(401).json({ error: "unauthorized" });
    }

    const campaignDoc = await Campaign.findOne({ campaignName: campaign });

    if (!campaignDoc) {
      return res.status(404).json({ error: "campaign_not_found" });
    }

    if (routes !== undefined) {
      if (!Array.isArray(routes)) {
        return res.status(400).json({ error: "invalid_route_structure" });
      }

      try {
        campaignDoc.routes = buildRoutes(routes);
      } catch {
        return res.status(400).json({ error: "invalid_route_structure" });
      }
    }

    if (Object.keys(config).length > 0) {
      campaignDoc.sendConfig = {
        ...(campaignDoc.sendConfig || {}),
        ...config,
        createdBy: req.user.mongoId, // 🔥 FIX
      };
    }

    await campaignDoc.save();

    res.json({ success: true });

  } catch (err) {
    console.error("SAVE CONFIG ERROR:", err);
    res.status(500).json({ error: err.message });
  }
}