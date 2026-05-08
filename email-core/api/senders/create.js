import express from "express";
import SenderServer from "../../models/SenderServer.js";
import auth from "../../middleware/auth.js";
import checkPermission from "../../middleware/checkPermission.js";

const router = express.Router();

router.post(
  "/",
  auth,
  checkPermission("sender.manage"),
  async (req, res) => {
    try {
      const {
        name,
        code,
        provider,
        baseUrl,
        dba,
        routes = [],
        priority,
        notes,
      } = req.body;

      if (!name || !code || !baseUrl) {
        return res.status(400).json({
          message: "name, code and baseUrl are required",
        });
      }

      if (!Array.isArray(routes) || routes.length === 0) {
        return res.status(400).json({
          message: "at_least_one_route_required",
        });
      }

      // 🔒 Validate routes (NO IP)
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
            message: "duplicate_route_detected",
          });
        }
        seen.add(key);
      }

      const existing = await SenderServer.findOne({
        $or: [
          { name: name.trim() },
          { code: code.toUpperCase().trim() },
        ],
      });

      if (existing) {
        return res.status(400).json({
          message: "sender_already_exists",
        });
      }

      const sender = await SenderServer.create({
        name: name.trim(),
        code: code.toUpperCase().trim(),
        provider,
        baseUrl: baseUrl.trim().replace(/\/$/, ""),
        dba: dba ? String(dba).trim().toLowerCase() : undefined,
        routes: cleanRoutes,
        priority: priority || 1,
        notes,
        createdBy: req.user._id,
      });

      res.status(201).json({
        message: "Sender created successfully",
        sender,
      });

    } catch (err) {
      console.error("Create sender error:", err);
      res.status(500).json({ message: err.message || "Server error" });
    }
  }
);

export default router;