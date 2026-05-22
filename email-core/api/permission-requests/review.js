import PermissionRequest from "../../models/PermissionRequest.js";
import User from "../../models/User.js";

export default async function reviewRequest(req, res) {
  try {
    const { requestId, status, adminNotes } = req.body;

    if (!requestId || !["APPROVED", "DENIED"].includes(status)) {
      return res.status(400).json({ error: "invalid_review_data" });
    }

    const request = await PermissionRequest.findById(requestId).populate("permission");
    if (!request) {
      return res.status(404).json({ error: "request_not_found" });
    }

    if (request.status !== "PENDING") {
      return res.status(400).json({ error: "request_already_processed" });
    }

    request.status = status;
    request.adminNotes = adminNotes;
    request.reviewedBy = req.user.mongoId;
    request.reviewedAt = new Date();
    await request.save();

    // If approved, add to user's extraPermissions
    if (status === "APPROVED") {
      await User.findByIdAndUpdate(request.user, {
        $addToSet: { extraPermissions: request.permission._id }
      });
    }

    res.json({ success: true, request });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "failed_to_review_request" });
  }
}
