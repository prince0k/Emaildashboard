import SenderServer from "../models/SenderServer.js";
import TriggerSetting from "../models/TriggerSetting.js";

/**
 * Gets the preferred sender and route for a specific trigger type.
 * Fallbacks to the highest priority active sender/route if no setting exists.
 * 
 * @param {string} triggerType - e.g. 'WELCOME', 'VERIFICATION'
 * @returns {Promise<{sender: Object, route: Object}>}
 */
export async function getTriggerSender(triggerType) {
  // 1. Check for specific trigger setting
  const setting = await TriggerSetting.findOne({ 
    triggerType: triggerType.toUpperCase(),
    active: true 
  }).populate("senderId").lean();

  if (setting && setting.senderId && setting.senderId.active) {
    const route = (setting.senderId.routes || []).find(
      r => r._id.toString() === setting.routeId && r.active !== false
    );
    if (route) {
      return { sender: setting.senderId, route };
    }
  }

  // 2. Fallback: Find highest priority active sender
  const fallbackSender = await SenderServer.findOne({ active: true })
    .sort({ priority: 1 }) // 1 = highest priority in this system usually
    .lean();

  if (!fallbackSender) return { sender: null, route: null };

  const fallbackRoute = (fallbackSender.routes || []).find(r => r.active !== false);
  
  return { sender: fallbackSender, route: fallbackRoute };
}
