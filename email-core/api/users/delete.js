import mongoose from "mongoose";
import User from "../../models/User.js";

export default async function deleteUser(req, res) {
  try {
    if (!req.user?.permissions?.includes("user.delete")) {
      return res.status(403).json({ error: "forbidden" });
    }

    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "missing_user_id" });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "invalid_user_id" });
    }

    if (userId === req.user.id) {
      return res.status(400).json({
        error: "cannot_delete_self",
      });
    }

    // 🔒 Fetch current user (authoritative)
    const currentUser = await User.findById(req.user.id)
      .populate("role", "name")
      .lean();

    if (!currentUser) {
      return res.status(401).json({ error: "user_not_found" });
    }

    const currentRoleName = currentUser.role?.name;

    // 🔒 Fetch target user
    const user = await User.findById(userId)
      .populate("role", "name");

    if (!user) {
      return res.status(404).json({ error: "user_not_found" });
    }

    // 🔒 Block super admin deletion
    if (
      user.role?.name === "super_admin" &&
      currentRoleName !== "super_admin"
    ) {
      return res.status(403).json({
        error: "cannot_delete_super_admin",
      });
    }

    // 🔒 Prevent deleting last super admin
    if (user.role?.name === "super_admin") {
      const superAdminCount = await User.countDocuments({
        role: user.role._id,
        active: true,
      });

      if (superAdminCount <= 1) {
        return res.status(400).json({
          error: "cannot_delete_last_super_admin",
        });
      }
    }

    if (!user.active) {
      return res.json({
        success: true,
        message: "user_already_inactive",
      });
    }

    user.active = false;
    await user.save();

    return res.json({
      success: true,
      message: "user_deactivated",
    });

  } catch (err) {
    console.error("Delete user error:", err);
    return res.status(500).json({ error: "server_error" });
  }
}