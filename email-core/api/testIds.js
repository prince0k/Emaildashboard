import express from "express";
import TestId from "../models/TestId.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// List all allowed test IDs
router.get("/", auth, async (req, res) => {
  try {
    const testIds = await TestId.find().sort("-createdAt");
    res.json({ testIds });
  } catch (err) {
    res.status(500).json({ error: "failed_to_fetch_test_ids" });
  }
});

// Add a new allowed test ID
router.post("/", auth, async (req, res) => {
  try {
    const { email, label } = req.body;
    if (!email) return res.status(400).json({ error: "email_required" });

    const testId = await TestId.create({
      email: email.toLowerCase().trim(),
      label: label || 'Global Test ID',
      addedBy: req.user?._id
    });

    res.json({ success: true, testId });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: "email_already_exists" });
    }
    res.status(500).json({ error: "failed_to_create_test_id" });
  }
});

// Remove an allowed test ID
router.delete("/:id", auth, async (req, res) => {
  try {
    await TestId.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "failed_to_delete_test_id" });
  }
});

export default router;
