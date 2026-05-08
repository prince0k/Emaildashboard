import PmtaSnapshot from "../../models/PmtaSnapshot.js";

export default async function (req, res) {
  const { server } = req.query;

  try {
    const data = await PmtaSnapshot.find({
      server: { $regex: `^${server}$`, $options: "i" }
    })
      .sort({ createdAt: -1 }) // latest
      .limit(50)
      .lean();

    res.json(data.reverse()); // graph order fix

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "failed" });
  }
}