import User from "../../models/User.js";
import Role from "../../models/Role.js";

export default async function updateUserRole(req, res) {
  try {
    if (!req.user?.permissions?.includes("user.update")) {
      return res.status(403).json({ error: "forbidden" });
    }

    const { userId, roleName } = req.body;

    if (!userId || !roleName) {
      return res.status(400).json({ error: "missing_required_fields" });
    }

    // 🔒 Fetch current user from DB (authoritative)
    const currentUser = await User.findById(req.user.id)
      .populate("role", "name")
      .lean();

    if (!currentUser) {
      return res.status(401).json({ error: "user_not_found" });
    }

    const currentRoleName = currentUser.role?.name;

    const role = await Role.findOne({
      name: roleName.toLowerCase(),
    });

    if (!role) {
      return res.status(400).json({ error: "invalid_role" });
    }

    const user = await User.findById(userId)
      .populate("role", "name");

    if (!user) {
      return res.status(404).json({ error: "user_not_found" });
    }

    if (!user.active) {
      return res.status(400).json({ error: "user_inactive" });
    }

    // 🔒 Block self change
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({
        error: "cannot_modify_own_role",
      });
    }

    // 🔒 Block editing super_admin
    if (
      user.role?.name === "super_admin" &&
      currentRoleName !== "super_admin"
    ) {
      return res.status(403).json({
        error: "cannot_modify_super_admin",
      });
    }

    // 🔒 Block assigning super_admin
    if (
      role.name === "super_admin" &&
      currentRoleName !== "super_admin"
    ) {
      return res.status(403).json({
        error: "cannot_assign_super_admin",
      });
    }

    user.role = role._id;
    await user.save();

    return res.json({
      success: true,
      message: "role_updated",
    });

  } catch (err) {
    console.error("Update role error:", err);
    return res.status(500).json({ error: "server_error" });
  }
}