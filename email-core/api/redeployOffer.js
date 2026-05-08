import mongoose from "mongoose";
import Offer from "../models/Offer.js";
import Deploy from "../models/Deploy.js";

/*
  REDEPLOY OFFER (FINAL)
  =====================
  - Uses MongoDB transactions (replica set required ✅)
  - Undeploys current active deploy
  - Creates a new deploy snapshot
  - Guarantees ONLY ONE active DEPLOYED record per offer_id
  - Fully atomic
*/

export default async function redeployOffer(req, res) {
  const runtimeOfferId = String(req.body.offer_id || "").trim();


  /* ======================
     VALIDATION
  ====================== */
  if (!runtimeOfferId) {
    return res.status(400).json({
      message: "offer_id is required",
    });
  }

  if (!/^[a-zA-Z0-9_-]{6,50}$/.test(runtimeOfferId)) {
    return res.status(400).json({
      message: "Invalid offer_id format",
    });
  }

    if (
    req.user.role !== "super_admin" &&
    !req.user.permissions?.includes("deploy.redeploy")
  ) {
    return res.status(403).json({ error: "forbidden" });
  }
  
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    /* ======================
       FETCH ACTIVE DEPLOY
    ====================== */
    const activeDeploy = await Deploy.findOne(
      { offer_id: runtimeOfferId, status: "DEPLOYED" },
      null,
      { session }
    );

    if (!activeDeploy) {
      await session.abortTransaction();
      return res.status(404).json({
        message: "No active deploy found for this offer_id",
      });
    }

    /* ======================
       FETCH OFFER MASTER
    ====================== */
    const offer = await Offer.findOne(
      { sid: activeDeploy.sid, isActive: true, isDeleted: false },
      null,
      { session }
    ).lean();

    if (!offer) {
      await session.abortTransaction();
      return res.status(400).json({
        message: "Offer is paused or deleted; cannot redeploy",
      });
    }

    /* ======================
       UNDEPLOY CURRENT
    ====================== */
    activeDeploy.status = "UNDEPLOYED";
    activeDeploy.undeployedAt = new Date();
    await activeDeploy.save({ session });

    /* ======================
       CREATE NEW DEPLOY
    ====================== */
    const [newDeploy] = await Deploy.create(
      [
        {
          offer_id: runtimeOfferId,
          sid: offer.sid,

          sponsor: offer.sponsor,
          cid: offer.cid,
          offer: offer.offer,
          vid: offer.vid || null,
          vertical: offer.vertical || null,

          redirectLinks: [...offer.redirectLinks],
          optoutLink: offer.optoutLink,
          md5FileName: offer.md5FileName,

          status: "DEPLOYED",
          deployedAt: new Date(),

          createdBy: req.user.id,
          serverName: process.env.SERVER_NAME || require("os").hostname(),
        },
      ],
      { session }
    );

    await session.commitTransaction();

    return res.status(201).json({
      success: true,
      message: "Offer redeployed successfully",
      deploy: {
        offer_id: newDeploy.offer_id,
        sid: newDeploy.sid,
        status: newDeploy.status,
        deployedAt: newDeploy.deployedAt,
      },
    });
  } catch (err) {
    await session.abortTransaction();

    // Partial unique index protection
    if (err.code === 11000) {
      return res.status(409).json({
        message: "This offer_id already has an active deploy",
      });
    }

    console.error("REDEPLOY OFFER ERROR:", err);
    return res.status(500).json({
      message: "Redeploy failed",
    });
  } finally {
    session.endSession();
  }
}
