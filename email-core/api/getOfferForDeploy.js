import Offer from "../models/Offer.js";

const normalize = (v = "") => String(v).trim().toLowerCase();

export default async function getOfferForDeploy(req, res) {
  try {
    const { sid } = req.query;

    /* ======================
       VALIDATION
    ====================== */
    if (!sid) {
      return res.status(400).json({
        message: "sid is required",
      });
    }

    const normalizedSid = normalize(sid);

    /* ======================
       FETCH OFFER MASTER
       (ACTIVE + NOT DELETED)
    ====================== */
    const offer = await Offer.findOne({
      sid: normalizedSid,
      isActive: true,
      isDeleted: false,
    }).lean();

    if (!offer) {
      return res.status(404).json({
        message: "Offer not found, inactive, or deleted",
      });
    }

    /* ======================
       RESPONSE (DEPLOY SNAPSHOT)
       MUST BE STABLE
    ====================== */
    return res.json({
      // identity
      sid: offer.sid,
      sponsor: offer.sponsor,
      cid: offer.cid,
      offer: offer.offer,

      // vertical
      vid: offer.vid || null,
      vertical: offer.vertical || null,

      // sending config
      redirectLinks: Array.isArray(offer.redirectLinks)
        ? offer.redirectLinks
        : [],

      optoutLink: offer.optoutLink,

      // suppression
      md5FileName: offer.md5FileName,
    });
  } catch (err) {
    console.error("GET OFFER FOR DEPLOY ERROR:", err);
    return res.status(500).json({
      message: "Failed to fetch offer for deploy",
    });
  }
}
