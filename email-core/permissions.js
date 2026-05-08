import express from "express";
import Permission from "../models/Permission.js";
import auth from "../middleware/auth.js";
import checkPermission from "../middleware/checkPermission.js";

const router = express.Router();

/* ======================
   LIST PERMISSIONS
====================== */
router.get(
  "/",
  auth,
  checkPermission("permission.view"),
  async (req, res) => {
    const permissions = await Permission.find().sort("module");
    res.json({ permissions });
  }
);

/* ======================
   CREATE PERMISSION
====================== */
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

/* ======================
   UPDATE PERMISSION
====================== */
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

/* ======================
   DELETE PERMISSION
====================== */
router.delete(
  "/:id",
  auth,
  checkPermission("permission.delete"),
  async (req, res) => {
    await Permission.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  }
);

export default router;