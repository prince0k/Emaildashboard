import jwt from "jsonwebtoken";
import { jwtConfig } from "../config/jwt.js";
import User from "../models/User.js";
import Permission from "../models/Permission.js";

// Simple TTL cache for admin permissions (avoids querying all permissions on every request)
let _adminPermsCache = { data: null, expires: 0 };
const ADMIN_PERMS_TTL = 60 * 1000; // 1 minute

async function getAdminPermissions() {
  if (_adminPermsCache.data && Date.now() < _adminPermsCache.expires) {
    return _adminPermsCache.data;
  }
  const allPerms = await Permission.find({}).lean();
  _adminPermsCache = {
    data: allPerms.map(p => p.name),
    expires: Date.now() + ADMIN_PERMS_TTL,
  };
  return _adminPermsCache.data;
}

export default async function auth(req, res, next) {
  try {
    let token;

    const authHeader = req.headers.authorization;

    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }

    const cookieName = process.env.COOKIE_NAME || "token";

    if (!token && req.cookies?.[cookieName]) {
      token = req.cookies[cookieName];
    }

    if (!token) {
      return res.status(401).json({ error: "authentication_required" });
    }

    const decoded = jwt.verify(token, jwtConfig.secret, {
      issuer: jwtConfig.issuer,
    });

    const user = await User.findById(decoded.mongoId)
      .populate({
        path: "role",
        populate: { path: "permissions" },
      })
      .populate("extraPermissions")
      .lean();

    if (!user || !user.active) {
      return res.status(401).json({ error: "user_not_authorized" });
    }

    if (!user.role) {
      return res.status(403).json({ error: "role_not_assigned" });
    }

    let finalPermissions = [];

    if (user.role.name === "admin") {
      // ⚡ God Mode: Admin always gets ALL permissions (cached for 1 min)
      finalPermissions = await getAdminPermissions();
    } else {
      const rolePermissions = user.role?.permissions?.map(p => p.name) || [];
      const extraPermissions = user.extraPermissions?.map(p => p.name) || [];
      finalPermissions = [...new Set([...rolePermissions, ...extraPermissions])];
    }

    req.user = {
      mongoId: user._id.toString(),
      userId: user.userId,
      email: user.email,
      permissions: finalPermissions,
    };

    next();
  } catch (err) {
    return res.status(401).json({ error: "invalid_or_expired_token" });
  }
}