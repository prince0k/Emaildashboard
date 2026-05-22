import PermissionRequest from "../../models/PermissionRequest.js";

export default async function listRequests(req, res) {
  try {
    const { status = "PENDING" } = req.query;

    const query = {};
    if (status !== "ALL") query.status = status;

    const requests = await PermissionRequest.find(query)
      .populate("user", "email userId")
      .populate("permission", "name module")
      .sort("-createdAt");

    res.json({ requests });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "failed_to_list_requests" });
  }
}
