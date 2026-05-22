import CampaignTrigger from "../../models/CampaignTrigger.js";
import Campaign from "../../models/Campaign.js";

export async function listTriggers(req, res) {
  try {
    const triggers = await CampaignTrigger.find()
      .populate("parentCampaignId", "campaignName")
      .populate("senderId", "name routes")
      .populate("offerId", "offer cid")
      .populate("creativeId", "name creativeName")
      .sort({ createdAt: -1 })
      .lean();

    const formattedTriggers = triggers.map(t => {
      const route = (t.senderId?.routes || []).find(r => String(r._id) === String(t.routeId));
      return {
        ...t,
        routeName: route ? `${route.vmta} | ${route.domain}` : "Unknown Route"
      };
    });

    res.json(formattedTriggers);
  } catch (err) {
    res.status(500).json({ error: "list_triggers_failed" });
  }
}

export async function createTrigger(req, res) {
  try {
    const {
      parentCampaignId,
      triggerType,
      senderId,
      routeId,
      offerId,
      creativeId,
      subjectIds,
      fromIds,
      isp
    } = req.body;

    if (!parentCampaignId || !senderId || !routeId || !offerId || !creativeId || !isp) {
      return res.status(400).json({ error: "missing_required_fields" });
    }

    const trigger = await CampaignTrigger.create({
      parentCampaignId,
      triggerType: triggerType || "OPEN",
      senderId,
      routeId,
      offerId,
      creativeId,
      subjectIds: subjectIds || [],
      fromIds: fromIds || [],
      isp,
      createdBy: req.user?._id
    });

    res.json(trigger);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: "trigger_already_exists_for_this_campaign" });
    }
    res.status(500).json({ error: "create_trigger_failed", message: err.message });
  }
}

export async function deleteTrigger(req, res) {
  try {
    const { id } = req.params;
    await CampaignTrigger.findByIdAndDelete(id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "delete_trigger_failed" });
  }
}

export async function testTrigger(req, res) {
  try {
    const {
      parentCampaignId,
      triggerType,
      senderId,
      routeId,
      offerId,
      creativeId,
      subjectIds,
      fromIds,
      isp,
      email
    } = req.body;

    if (!email) return res.status(400).json({ error: "email_required" });

    const { processCampaignTrigger } = await import("../../services/triggerService.js");
    const Campaign = (await import("../../models/Campaign.js")).default;
    
    const campaignDoc = await Campaign.findById(parentCampaignId).lean();
    
    const mockTrigger = {
      senderId,
      routeId,
      offerId,
      creativeId,
      subjectIds: subjectIds || [],
      fromIds: fromIds || [],
      isp,
      active: true
    };

    console.log(`🧪 TEST TRIGGER: Firing for ${email}`);
    
    await processCampaignTrigger(campaignDoc || { _id: parentCampaignId }, email, mockTrigger);

    res.json({ success: true, message: "Test trigger fired" });
  } catch (err) {
    console.error("TEST TRIGGER FAILED:", err);
    res.status(500).json({ error: "test_failed", message: err.message });
  }
}
