import User from "../../models/User.js";

export default async function listUsers(req, res) {
  try {
    if (!req.user?.permissions?.includes("user.view")) {
      return res.status(403).json({ error: "forbidden" });
    }

    const pageRaw = parseInt(req.query.page, 10);
    const limitRaw = parseInt(req.query.limit, 10);

    const page = Number.isInteger(pageRaw) && pageRaw > 0 ? pageRaw : 1;
    const limit = Number.isInteger(limitRaw) && limitRaw > 0
      ? Math.min(limitRaw, 100)
      : 20;

    const skip = (page - 1) * limit;

    const query = { active: true };

    const search = req.query.search?.trim();

    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      query.$or = [
        { email: { $regex: escaped, $options: "i" } },
        { userId: { $regex: escaped, $options: "i" } },
      ];
    }

    const users = await User.find(query)
      .populate("role", "name")
      .select("-password")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean();

    const total = await User.countDocuments(query);

    return res.json({
      total,
      page,
      pages: Math.ceil(total / limit),
      users,
    });

  } catch (err) {
    console.error("List users error:", err);
    return res.status(500).json({ error: "server_error" });
  }
}