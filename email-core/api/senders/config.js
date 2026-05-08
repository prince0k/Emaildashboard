import express from "express";
import SenderServer from "../../models/SenderServer.js";
import auth from "../../middleware/auth.js";

const router = express.Router();

router.get("/", auth, async (req, res) => {
  try {
    const servers = await SenderServer.find({ active: true })
      .select("name routes priority")
      .lean();

    res.json({
      servers,
    });
  } catch (err) {
    console.error("Fetch sender config error:", err);
    res.status(500).json({ error: "failed_to_fetch_senders" });
  }
});

export default router;