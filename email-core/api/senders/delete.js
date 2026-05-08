import express from "express";
import mongoose from "mongoose";
import SenderServer from "../../models/SenderServer.js";
import Campaign from "../../models/Campaign.js";
import auth from "../../middleware/auth.js";
import checkPermission from "../../middleware/checkPermission.js";

const router = express.Router();

router.delete(
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

      if (!sender.active) {
        return res.status(400).json({ error: "sender_already_inactive" });
      }

      const campaignUsingSender = await Campaign.findOne({
        sender: id,
        status: { $in: ["CREATED", "DEPLOYED", "RUNNING", "PAUSED"] }
      });

      if (campaignUsingSender) {
        return res.status(400).json({
          error: "sender_in_use_cannot_delete",
        });
      }

      sender.active = false;
      await sender.save();

      return res.json({ status: "deactivated" });

    } catch (err) {
      console.error("Delete sender error:", err);
      return res.status(500).json({ error: "sender_delete_failed" });
    }
  }
);

export default router;