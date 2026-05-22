import TriggerSetting from "../../models/TriggerSetting.js";
import SenderServer from "../../models/SenderServer.js";

export default async function listTriggers(req, res) {
  try {
    const settings = await TriggerSetting.find({})
      .populate("senderId", "name code routes")
      .lean();

    // Map settings to include route details
    const formatted = settings.map(s => {
      const route = (s.senderId?.routes || []).find(r => r._id.toString() === s.routeId);
      return {
        ...s,
        routeName: route ? `${route.vmta} (${route.domain})` : "Unknown Route"
      };
    });

    res.json({ success: true, settings: formatted });
  } catch (err) {
    console.error("List triggers error:", err);
    res.status(500).json({ error: "failed_to_list_triggers" });
  }
}
