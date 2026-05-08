import express from "express";
import mongoose from "mongoose";
import SenderServer from "../../models/SenderServer.js";
import Campaign from "../../models/Campaign.js";
import auth from "../../middleware/auth.js";
import checkPermission from "../../middleware/checkPermission.js";

const router = express.Router();

router.patch(
  "/:id",
  auth,
  checkPermission("sender.manage"),
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: "invalid_sender_id" });
      }

      const sender = await SenderServer.findById(id);
      if (!sender) {
        return res.status(404).json({ error: "sender_not_found" });
      }

      const willDisable = sender.active === true;

      if (willDisable) {
        const activeCampaign = await Campaign.findOne({
          sender: id,
          status: { $in: ["CREATED", "DEPLOYED", "RUNNING", "PAUSED"] },
        });

        if (activeCampaign) {
          return res.status(400).json({
            error: "cannot_disable_sender_active_campaign",
          });
        }
      }

      sender.active = !sender.active;
      await sender.save();

      return res.json({
        status: "updated",
        active: sender.active,
      });

    } catch (err) {
      console.error("Toggle sender error:", err);
      return res.status(500).json({ error: "sender_toggle_failed" });
    }
  }
);

export default router;