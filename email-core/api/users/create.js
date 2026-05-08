import User from "../../models/User.js";
import Role from "../../models/Role.js";
import normalizeEmail from "../../utils/normalizeEmail.js";

export default async function createUser(req, res) {
  try {
    /* ================= PERMISSION ================= */
    if (!req.user?.permissions?.includes("user.create")) {
      return res.status(403).json({ error: "forbidden" });
    }

    const email = normalizeEmail(req.body.email);
    const { password, roleName } = req.body;

    /* ================= VALIDATION ================= */
    if (!email || !password || !roleName) {
      return res.status(400).json({ error: "missing_required_fields" });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: "weak_password" });
    }

    const existing = await User.findOne({ email }).lean();
    if (existing) {
      return res.status(409).json({ error: "user_already_exists" });
    }

    const role = await Role.findOne({
      name: roleName.toLowerCase(),
    });

    if (!role) {
      return res.status(400).json({ error: "invalid_role" });
    }

    /* ================= SUPER ADMIN PROTECTION ================= */
    if (
      role.name === "super_admin" &&
      req.user.role !== "super_admin"
    ) {
      return res.status(403).json({
        error: "cannot_assign_super_admin",
      });
    }

    const user = await User.create({
      email,
      password,
      role: role._id,
      active: true,
    });

    return res.status(201).json({
      success: true,
      user: {
        id: user._id,
        userId: user.userId,
        email: user.email,
        role: role.name,
        active: user.active,
      },
    });

  } catch (err) {
    console.error("Create user error:", err);
    return res.status(500).json({ error: "server_error" });
  }
}