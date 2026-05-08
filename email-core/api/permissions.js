import express from "express";
import Permission from "../models/Permission.js";
import auth from "../middleware/auth.js";
import checkPermission from "../middleware/checkPermission.js";

const router = express.Router();

router.get(
  "/",
  auth,
  checkPermission("permission.view"),
  async (req, res) => {
    const permissions = await Permission.find().sort("module");
    res.json({ permissions });
  }
);

router.post(
  "/",
  auth,
  checkPermission("permission.create"),
  async (req, res) => {
    const { name, module, description } = req.body;

    const permission = await Permission.create({
      name,
      module,
      description,
    });

    res.json({ permission });
  }
);

router.put(
  "/:id",
  auth,
  checkPermission("permission.update"),
  async (req, res) => {
    const permission = await Permission.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json({ permission });
  }
);

router.delete(
  "/:id",
  auth,
  checkPermission("permission.delete"),
  async (req, res) => {
    const permission = await Permission.findById(req.params.id);

    if (!permission) {
      return res.status(404).json({ error: "permission_not_found" });
    }

    const Role = (await import("../models/Role.js")).default;

    const roleUsing = await Role.countDocuments({
      permissions: permission._id,
    });

    if (roleUsing > 0) {
      return res.status(400).json({
        error: "permission_in_use",
      });
    }

    await permission.deleteOne();

    res.json({ success: true });
  }
);

export default router;