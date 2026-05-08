import Deploy from "../models/Deploy.js";

/*
  UNDEPLOY OFFER
  ==============
  - Idempotent
  - Undeploys the CURRENT active deploy for a runtime offer_id
  - Safe to call multiple times
*/

export default async function undeployOffer(req, res) {
  try {
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
      !req.user.permissions?.includes("deploy.run")
    ) {
      return res.status(403).json({ error: "forbidden" });
    }

    /* ======================
       FETCH ACTIVE DEPLOY
    ====================== */
    const activeDeploy = await Deploy.findOne({
      offer_id: runtimeOfferId,
      status: "DEPLOYED",
    });

    // Idempotent behavior
    if (!activeDeploy) {
      return res.status(200).json({
        success: true,
        message: "No active deploy found (already undeployed or never deployed)",
        offer_id: runtimeOfferId,
        status: "UNDEPLOYED",
      });
    }

    /* ======================
       UNDEPLOY (SCHEMA SAFE)
    ====================== */
    activeDeploy.status = "UNDEPLOYED";
    activeDeploy.undeployedAt = new Date();
    await activeDeploy.save();

    return res.json({
      success: true,
      message: "Offer undeployed successfully",
      offer_id: activeDeploy.offer_id,
      status: activeDeploy.status,
      undeployedAt: activeDeploy.undeployedAt,
    });
  } catch (err) {
    console.error("UNDEPLOY OFFER ERROR:", err);
    return res.status(500).json({
      message: "Undeploy failed",
    });
  }
}
