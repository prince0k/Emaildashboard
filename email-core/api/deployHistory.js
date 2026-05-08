import Deploy from "../models/Deploy.js";

/*
  DEPLOY HISTORY
  ==============
  - Read-only
  - Admin/reporting use
  - Supports filtering by:
    • runtime offer_id
    • offer sid
    • or global history (explicit)
*/

const normalize = (v = "") => String(v).trim().toLowerCase();

export default async function deployHistory(req, res) {
  try {
    console.log("DEPLOY HISTORY HIT");
    const { offer_id, sid, limit = 200 } = req.query;

    /* ======================
       VALIDATION
    ====================== */
    if (offer_id && sid) {
      return res.status(400).json({
        message: "Provide either offer_id or sid, not both",
      });
    }

    /* ======================
       FILTER
    ====================== */
    const filter = {};

    if (offer_id) {
      filter.offer_id = normalize(offer_id);
    }

    if (sid) {
      filter.sid = normalize(sid);
    }

    /* ======================
       LIMIT SAFETY
    ====================== */
    const safeLimit = Math.min(
      Math.max(parseInt(limit, 10) || 100, 1),
      500
    );

    /* ======================
       QUERY
    ====================== */
    const history = await Deploy.find(filter)
      .sort({ deployedAt: -1 })
      .limit(safeLimit)
      .select({
        offer_id: 1,
        sid: 1,
        sponsor: 1,
        cid: 1,
        offer: 1,
        vid: 1,
        vertical: 1,
        status: 1,
        deployedAt: 1,
        undeployedAt: 1,
      })
      .lean();

    return res.json({
      success: true,
      scope: offer_id
        ? "offer_id"
        : sid
        ? "sid"
        : "global",
      count: history.length,
      history,
    });
  } catch (err) {
    console.error("DEPLOY HISTORY ERROR:", err);
    return res.status(500).json({
      message: "Failed to fetch deploy history",
    });
  }
}
