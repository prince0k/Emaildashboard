import TriggerSetting from "../../models/TriggerSetting.js";
import SenderServer from "../../models/SenderServer.js";

export default async function updateTrigger(req, res) {
  try {
    const { triggerType, senderId, routeId, active } = req.body;

    if (!triggerType || !senderId || !routeId) {
      return res.status(400).json({ error: "missing_fields" });
    }

    // Verify sender and route exist
    const sender = await SenderServer.findById(senderId);
    if (!sender) return res.status(404).json({ error: "sender_not_found" });

    const routeExists = (sender.routes || []).some(r => r._id.toString() === routeId);
    if (!routeExists) return res.status(400).json({ error: "route_not_found_on_sender" });

    const updated = await TriggerSetting.findOneAndUpdate(
      { triggerType: triggerType.toUpperCase() },
      {
        senderId,
        routeId,
        active: active !== undefined ? active : true,
        lastUpdatedBy: req.user?._id
      },
      { upsert: true, new: true }
    );

    res.json({ success: true, setting: updated });
  } catch (err) {
    console.error("Update trigger error:", err);
    res.status(500).json({ error: "failed_to_update_trigger" });
  }
}
