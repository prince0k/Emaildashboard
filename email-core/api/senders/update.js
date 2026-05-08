import express from "express";
import mongoose from "mongoose";
import SenderServer from "../../models/SenderServer.js";
import auth from "../../middleware/auth.js";
import checkPermission from "../../middleware/checkPermission.js";

const router = express.Router();

router.put(
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

      const {
        name,
        code,
        provider,
        baseUrl,
        dba,
        routes,
        priority,
        notes,
        active,
      } = req.body;

      if (baseUrl && !baseUrl.startsWith("https://")) {
        return res.status(400).json({
          error: "baseUrl_must_be_https",
        });
      }

      if (name !== undefined) sender.name = name.trim();
      if (code !== undefined) sender.code = code.toUpperCase().trim();
      if (provider !== undefined) sender.provider = provider;
      if (baseUrl !== undefined)
        sender.baseUrl = baseUrl.trim().replace(/\/$/, "");

      // NEW
      if (dba !== undefined)
        sender.dba = dba ? String(dba).trim().toLowerCase() : undefined;
      if (priority !== undefined) sender.priority = priority;
      if (notes !== undefined) sender.notes = notes;
      if (active !== undefined) sender.active = active;

      // 🔒 If routes provided, validate
      if (routes !== undefined) {
        if (!Array.isArray(routes) || routes.length === 0) {
          return res.status(400).json({
            error: "at_least_one_route_required",
          });
        }

        const cleanRoutes = routes.map((r, index) => {
          if (!r.vmta || !r.domain || !r.from_user) {
            throw new Error(`invalid_route_at_index_${index}`);
          }

          return {
            vmta: String(r.vmta).trim(),
            domain: String(r.domain).trim().toLowerCase(),
            from_user: String(r.from_user).trim(),
            trackingDomain: r.trackingDomain
              ? String(r.trackingDomain).trim().toLowerCase()
              : undefined,
            active: r.active !== false,
          };
        });

        // 🔒 Prevent duplicate routes
        const seen = new Set();
        for (const r of cleanRoutes) {
          const key = `${r.vmta}:${r.domain}:${r.from_user}`;
          if (seen.has(key)) {
            return res.status(400).json({
              error: "duplicate_route_detected",
            });
          }
          seen.add(key);
        }

        sender.routes = cleanRoutes;
      }

      await sender.save();

      res.json({
        message: "Sender updated successfully",
        sender,
      });

    } catch (err) {
      console.error("Update sender error:", err);
      res.status(500).json({ error: err.message || "sender_update_failed" });
    }
  }
);

export default router;