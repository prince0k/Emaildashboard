import Campaign from "../../models/Campaign.js";
import { callSender } from "./helpers/senderBridge.js";
import { validateTransition } from "./helpers/validateTransition.js";

export default async function controlCampaign(req, res) {
  try {
    const rawCampaign = req.params.campaign;
    const {
      action,
      totalSend,
      sendInSeconds,
      sendInMinutes,
      sendInHours,
    } = req.body || {};

    if (!rawCampaign || typeof rawCampaign !== "string") {
      return res.status(400).json({ error: "invalid_campaign" });
    }

    const campaignName = decodeURIComponent(rawCampaign).trim();

    if (!["PAUSE", "RESUME", "STOP"].includes(action)) {
      return res.status(400).json({ error: "invalid_action" });
    }

    const campaign = await Campaign.findOne({ campaignName });

    if (!campaign) {
      return res.status(404).json({ error: "campaign_not_found" });
    }

    /* =====================
       MAP ACTION → STATUS
    ===================== */

    const actionToStatus = {
      PAUSE: "PAUSED",
      RESUME: "RUNNING",
      STOP: "STOPPED",
    };

    const targetStatus = actionToStatus[action];

    const parsePositiveInt = (value) => {
      if (value === undefined || value === null || value === "") return null;
      const parsed = parseInt(value, 10);
      return Number.isNaN(parsed) || parsed <= 0 ? "INVALID" : parsed;
    };

    const parsedTotalSend = parsePositiveInt(totalSend);
    const parsedSendInSeconds = parsePositiveInt(sendInSeconds);
    const parsedSendInMinutes = parsePositiveInt(sendInMinutes);
    const parsedSendInHours = parsePositiveInt(sendInHours);

    if (
      parsedTotalSend === "INVALID" ||
      parsedSendInSeconds === "INVALID" ||
      parsedSendInMinutes === "INVALID" ||
      parsedSendInHours === "INVALID"
    ) {
      return res.status(400).json({ error: "invalid_resume_send_config" });
    }

    /* =====================
       TERMINAL STATE BLOCK
    ===================== */

    if (["COMPLETED", "FAILED"].includes(campaign.status)) {
      return res.status(400).json({ error: "campaign_not_controllable" });
    }

    /* =====================
       TRANSITION VALIDATION
    ===================== */

    if (!validateTransition(campaign.status, targetStatus)) {
      return res.status(400).json({ error: "invalid_transition" });
    }

    /* =====================
       CALL SENDER
    ===================== */

     const runtimeConfig = {};
    if (action === "RESUME") {
      const effectiveTotalSend =
        parsedTotalSend ?? campaign.sendConfig?.totalSend ?? null;
      const effectiveSendInSeconds =
        parsedSendInSeconds ?? campaign.sendConfig?.sendInSeconds ?? null;
      const effectiveSendInMinutes =
        parsedSendInMinutes ?? campaign.sendConfig?.sendInMinutes ?? null;
      const effectiveSendInHours =
        parsedSendInHours ?? campaign.sendConfig?.sendInHours ?? null;

      if (effectiveTotalSend) runtimeConfig.totalSend = effectiveTotalSend;
      if (effectiveSendInSeconds) runtimeConfig.sendInSeconds = effectiveSendInSeconds;
      if (effectiveSendInMinutes) runtimeConfig.sendInMinutes = effectiveSendInMinutes;
      if (effectiveSendInHours) runtimeConfig.sendInHours = effectiveSendInHours;

      if (
        runtimeConfig.totalSend &&
        !runtimeConfig.sendInSeconds &&
        !runtimeConfig.sendInMinutes &&
        !runtimeConfig.sendInHours
      ) {
        return res.status(400).json({ error: "resume_throttle_required" });
      }
    }

    const senderResponse = await callSender(
      campaign.sender,
      "updateControl.php",
      {
        campaignName: campaign.campaignName,
        action,
        status: targetStatus,
        ...runtimeConfig,
      }
    );

    if (
      !senderResponse ||
      senderResponse.error ||
      senderResponse.status !== "updated"
    ) {
      return res.status(502).json({
        error: "sender_control_failed",
        details: senderResponse,
      });
    }

    /* =====================
       UPDATE DB STATUS
    ===================== */

    campaign.execution = campaign.execution || {};

    campaign.status = targetStatus;

    if (action === "RESUME") {
      campaign.sendConfig = campaign.sendConfig || {};
      if (parsedTotalSend) campaign.sendConfig.totalSend = parsedTotalSend;
      if (parsedSendInSeconds) campaign.sendConfig.sendInSeconds = parsedSendInSeconds;
      if (parsedSendInMinutes) campaign.sendConfig.sendInMinutes = parsedSendInMinutes;
      if (parsedSendInHours) campaign.sendConfig.sendInHours = parsedSendInHours;
    }

    if (targetStatus === "STOPPED") {
      campaign.execution.completedAt = new Date();
    }

    campaign.execution.lastStatusUpdate = new Date();

    await campaign.save();

    return res.json({
      status: "ok",
      campaign: campaign.campaignName,
      newStatus: targetStatus,
      runtimeConfig,
    });

  } catch (err) {
    console.error("CONTROL CAMPAIGN ERROR:", err);
    return res.status(500).json({ error: "control_failed" });
  }
}
