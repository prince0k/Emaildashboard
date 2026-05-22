import PermissionRequest from "../../models/PermissionRequest.js";
import Permission from "../../models/Permission.js";

export default async function createRequest(req, res) {
  try {
    const { permissionId, reason } = req.body;

    if (!permissionId) {
      return res.status(400).json({ error: "permission_required" });
    }

    // Check if permission exists
    const perm = await Permission.findById(permissionId);
    if (!perm) {
      return res.status(404).json({ error: "permission_not_found" });
    }

    // Check if user already has this permission
    if (req.user.permissions.includes(perm.name)) {
      return res.status(400).json({ error: "already_has_permission" });
    }

    // Check for existing pending request
    const existing = await PermissionRequest.findOne({
      user: req.user.mongoId,
      permission: permissionId,
      status: "PENDING"
    });

    if (existing) {
      return res.status(400).json({ error: "request_already_pending" });
    }

    const request = await PermissionRequest.create({
      user: req.user.mongoId,
      permission: permissionId,
      reason
    });

    res.json({ success: true, request });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "failed_to_create_request" });
  }
}
