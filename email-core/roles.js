import express from "express";
import Role from "../models/Role.js";
import auth from "../middleware/auth.js";
import checkPermission from "../middleware/checkPermission.js";

const router = express.Router();

/* ======================
   LIST ROLES
====================== */
router.get(
  "/",
  auth,
  checkPermission("role.view"),
  async (req, res) => {
    const roles = await Role.find().populate("permissions");
    res.json({ roles });
  }
);

/* ======================
   CREATE ROLE
====================== */
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

/* ======================
   UPDATE ROLE
====================== */
router.put(
  "/:id",
  auth,
  checkPermission("role.update"),
  async (req, res) => {
    const { id } = req.params;
    const { name, description, permissions } = req.body;

    const role = await Role.findByIdAndUpdate(
      id,
      { name, description, permissions },
      { new: true }
    );

    res.json({ role });
  }
);

/* ======================
   DELETE ROLE
====================== */
router.delete(
  "/:id",
  auth,
  checkPermission("role.delete"),
  async (req, res) => {
    await Role.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  }
);

export default router;