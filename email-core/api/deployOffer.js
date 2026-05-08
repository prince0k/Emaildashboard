import Offer from "../models/Offer.js";
import Deploy from "../models/Deploy.js";

/*
  DEPLOY OFFER
  ============
  RULES (EXPLICIT):

  ❌ SAME runtime offer_id CANNOT be deployed twice
  ✅ SAME sid CAN be deployed multiple times with DIFFERENT offer_id
*/

export default async function deployOffer(req, res) {
  try {
    const sid = String(req.body.sid || "").trim().toLowerCase();
    const runtimeOfferId = String(req.body.offer_id || "").trim();



    /* ======================
       VALIDATION
    ====================== */
    if (!sid || !runtimeOfferId) {
      return res.status(400).json({
        message: "sid and offer_id are required",
      });
    }

    if (!/^[a-zA-Z0-9_-]{6,50}$/.test(runtimeOfferId)) {
      return res.status(400).json({
        message: "Invalid offer_id format",
      });
    }

    if (
      req.user.role !== "super_admin" &&
      !req.user.permissions?.includes("deploy.run")
    ) {
      return res.status(403).json({ error: "forbidden" });
    }

    /* ======================
       BLOCK DUPLICATE DEPLOY
       (HUMAN-FRIENDLY CHECK)
    ====================== */
    const existingDeploy = await Deploy.findOne({
      offer_id: runtimeOfferId,
      status: "DEPLOYED",
    });

    if (existingDeploy) {
      return res.status(409).json({
        message: "This offer_id is already deployed",
        offer_id: runtimeOfferId,
      });
    }

    /* ======================
       FETCH OFFER MASTER
    ====================== */
    const offer = await Offer.findOne({
      sid,
      isActive: true,
      isDeleted: false,
    }).lean();

    if (!offer) {
      return res.status(404).json({
        message: "Offer not found, inactive, or deleted",
      });
    }

    /* ======================
       CREATE DEPLOY
       (DB INDEX IS FINAL GUARD)
    ====================== */
    const deploy = await Deploy.create({
      offer_id: runtimeOfferId,
      sid: offer.sid,

      sponsor: offer.sponsor,
      cid: offer.cid,
      offer: offer.offer,
      vid: offer.vid || null,
      vertical: offer.vertical || null,

      redirectLinks: Array.isArray(offer.redirectLinks)
        ? [...offer.redirectLinks]
        : [],

      optoutLink: offer.optoutLink,
      md5FileName: offer.md5FileName,

      status: "DEPLOYED",
      deployedAt: new Date(),

      createdBy: req.user.id,
      serverName: process.env.SERVER_NAME || require("os").hostname(),
    });

    return res.status(201).json({
      success: true,
      message: "Offer deployed successfully",
      deploy: {
        offer_id: deploy.offer_id,
        sid: deploy.sid,
        status: deploy.status,
        deployedAt: deploy.deployedAt,
      },
    });
  } catch (err) {
    // Final safety net (race condition)
    if (err.code === 11000) {
      return res.status(409).json({
        message: "This offer_id is already deployed",
      });
    }

    console.error("DEPLOY OFFER ERROR:", err);
    return res.status(500).json({
      message: "Deploy failed",
    });
  }
}
