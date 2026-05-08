import express from "express";
import Role from "../models/Role.js";
import auth from "../middleware/auth.js";
import checkPermission from "../middleware/checkPermission.js";

const router = express.Router();

router.get(
  "/",
  auth,
  checkPermission("role.view"),
  async (req, res) => {
    const roles = await Role.find().populate("permissions");
    res.json({ roles });
  }
);

router.post(
  "/",
  auth,
  checkPermission("role.create"),
  async (req, res) => {
    const { name, description, permissions } = req.body;

    const role = await Role.create({
      name,
      description,
      permissions,
    });

    res.json({ role });
  }
);

router.put(
  "/:id",
  auth,
  checkPermission("role.update"),
  async (req, res) => {
    const { name, description, permissions } = req.body;

    const role = await Role.findByIdAndUpdate(
      req.params.id,
      { name, description, permissions },
      { new: true }
    );

    res.json({ role });
  }
);

router.delete(
  "/:id",
  auth,
  checkPermission("role.delete"),
  async (req, res) => {
    const role = await Role.findById(req.params.id);

    if (!role) {
      return res.status(404).json({ error: "role_not_found" });
    }

    if (role.isSystem) {
      return res.status(403).json({ error: "cannot_delete_system_role" });
    }

    const userCount = await import("../models/User.js")
      .then(m => m.default.countDocuments({ role: role._id }));

    if (userCount > 0) {
      return res.status(400).json({
        error: "role_assigned_to_users",
      });
    }

    await role.deleteOne();

    res.json({ success: true });
  }
);

export default router;