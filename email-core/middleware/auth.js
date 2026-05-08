import jwt from "jsonwebtoken";
import { jwtConfig } from "../config/jwt.js";
import User from "../models/User.js";

export default async function auth(req, res, next) {
  try {
    let token;

    const authHeader = req.headers.authorization;

    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }

    if (!token && req.cookies?.token) {
      token = req.cookies.token;
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
      .populate("extraPermissions");

    if (!user || !user.active) {
      return res.status(401).json({ error: "user_not_authorized" });
    }

    if (!user.role) {
      return res.status(403).json({ error: "role_not_assigned" });
    }

    const rolePermissions =
      user.role?.permissions?.map(p => p.name) || [];

    const extraPermissions =
      user.extraPermissions?.map(p => p.name) || [];

    req.user = {
      mongoId: user._id.toString(),
      userId: user.userId,
      email: user.email,
      permissions: [...new Set([...rolePermissions, ...extraPermissions])],
    };

    next();
  } catch (err) {
    return res.status(401).json({ error: "invalid_or_expired_token" });
  }
}