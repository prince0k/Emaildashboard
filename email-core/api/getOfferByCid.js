import Offer from "../models/Offer.js";

/*
  LEGACY ENDPOINT — READ ONLY
  ==========================
  ⚠️ DO NOT USE FOR:
  - deploy
  - tracking
  - suppression
  - link generation

  Purpose:
  - legacy UI
  - previews
  - backward compatibility
*/

export default async function getOfferByCid(req, res) {
  try {
    const { cid } = req.query;

    /* ======================
       VALIDATION
    ====================== */
    if (!cid) {
      return res.status(400).json({
        error: "cid is required",
      });
    }

    const normalizedCid = String(cid).toLowerCase().trim();

    /* ======================
       FETCH ONE ACTIVE OFFER
       (CID IS NOT UNIQUE — LEGACY BEHAVIOR)
    ====================== */
    const offer = await Offer.findOne({
      cid: normalizedCid,
      isActive: true,
      isDeleted: false,
    })
      .sort({ createdAt: -1 }) // newest wins (explicit)
      .lean();

    if (!offer) {
      return res.status(404).json({
        error: "Active offer not found for this cid",
      });
    }

    /* ======================
       RESPONSE (LEGACY SAFE)
    ====================== */
    return res.json({
      legacy: true,

      // identity
      sponsor: offer.sponsor,
      cid: offer.cid,
      offer: offer.offer,

      // vertical
      vid: offer.vid || null,
      vertical: offer.vertical || null,

      // sending
      redirectLinks: Array.isArray(offer.redirectLinks)
        ? offer.redirectLinks
        : [],
      optoutLink: offer.optoutLink,

      // informational only
      md5FileName: offer.md5FileName,
    });
  } catch (err) {
    console.error("GET OFFER BY CID ERROR:", err);
    return res.status(500).json({
      error: "Failed to fetch offer",
    });
  }
}
