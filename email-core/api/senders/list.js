import express from "express";
import SenderServer from "../../models/SenderServer.js";
import auth from "../../middleware/auth.js";
import checkPermission from "../../middleware/checkPermission.js";

const router = express.Router();

router.get(
  "/",
  auth,
  checkPermission("sender.view"),
  async (req, res) => {
    try {
      const { active } = req.query;

      const filter = {};

      if (active === "true") filter.active = true;
      if (active === "false") filter.active = false;

      const senders = await SenderServer.find(filter)
        .select("name code provider baseUrl dba active priority createdAt routes")
        .sort({ createdAt: -1 })
        .lean();

      return res.json({ senders });

    } catch (err) {
      console.error("List sender error:", err);
      return res.status(500).json({ error: "sender_list_failed" });
    }
  }
);

export default router;