import PmtaSnapshot from "../../models/PmtaSnapshot.js";

export default async function (req, res) {
  try {
    const data = await PmtaSnapshot.aggregate([
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: "$server",
          doc: { $first: "$$ROOT" }
        }
      },
      {
        $replaceRoot: { newRoot: "$doc" }
      }
    ]);

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed" });
  }
}