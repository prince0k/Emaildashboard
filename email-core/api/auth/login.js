import jwt from "jsonwebtoken";
import User from "../../models/User.js";
import "../../models/Permission.js";
import { jwtConfig } from "../../config/jwt.js";

export default async function login(req, res) {
  try {
    const email = req.body.email?.toLowerCase().trim();
    const { password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({ email })
      .select("+password +active")
      .populate({
        path: "role",
        populate: { path: "permissions" },
      })
      .populate("extraPermissions");

    if (!user || !user.active) {
      await new Promise((r) => setTimeout(r, 300));
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      await new Promise((r) => setTimeout(r, 300));
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    if (!user.role) {
      return res.status(500).json({
        message: "User role not configured",
      });
    }

    const rolePermissions =
      user.role.permissions?.map((p) => p.name) || [];

    const extraPermissions =
      user.extraPermissions?.map((p) => p.name) || [];

    const allPermissions = [
      ...new Set([...rolePermissions, ...extraPermissions]),
    ];

    const token = jwt.sign(
  {
    mongoId: user._id.toString(),  // Mongo ID
    userId: user.userId,           // 🔥 Business ID (USR00001)
    email: user.email,
    role: user.role.name,
    permissions: allPermissions,
  },
  jwtConfig.secret,
  {
    expiresIn: jwtConfig.expiresIn,
    issuer: jwtConfig.issuer,
  }
);

    res.cookie("token", token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  path: "/",
});

    return res.json({
  success: true,
  token,
  user: {
    id: user._id,
    userId: user.userId,
    email: user.email,
    role: user.role.name,
    permissions: allPermissions, // 🔥 ADD THIS
  },
});

  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({
      message: "Server error",
    });
  }
}