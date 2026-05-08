import User from "../../models/User.js";
import Role from "../../models/Role.js";
import normalizeEmail from "../../utils/normalizeEmail.js";

export default async function createUser(req, res) {
  try {
    // 🔐 Must have permission
    if (!req.user?.permissions?.includes("user.create")) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const email = normalizeEmail(req.body.email);
    const { password, roleName } = req.body;

    if (!email || !password || !roleName) {
      return res.status(400).json({
        error: "Email, password and role are required",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        error: "Password must be at least 8 characters long",
      });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(409).json({
        error: "User already exists",
      });
    }

    const role = await Role.findOne({
      name: roleName.toLowerCase(),
    });

    if (!role) {
      return res.status(400).json({
        error: "Invalid role",
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
      },
    });

  } catch (err) {
    console.error("Create user error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}