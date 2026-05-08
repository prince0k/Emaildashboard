import Campaign from "../../models/Campaign.js";

import fs from "fs";
export default async function updatePmtaStats(req, res) {
  try {

    const internalKey = req.headers["x-internal-key"];

    if (!internalKey || internalKey !== process.env.SENDER_INTERNAL_KEY) {
      console.log("❌ Invalid internal key");
      return res.status(403).json({ error: "forbidden" });
    }

    const {
  runtimeOfferId,

  delivered_vmta = {},
  delivered_isp = {},

  hard_vmta = {},
  soft_vmta = {},

  hard_isp = {},
  soft_isp = {},

  hardEmails = []
} = req.body;
    console.log("HARD EMAILS:", hardEmails);
    console.log("Incoming payload:", req.body);

    if (!runtimeOfferId) {
      return res.status(400).json({ error: "missing_runtimeOfferId" });
    }

    /* SAFE SUM FUNCTION */

    const sum = (obj) => {
  if (!obj || typeof obj !== "object") return 0;

  let total = 0;

  Object.values(obj).forEach((v) => {
    const num = parseInt(String(v).trim(), 10);
    if (!isNaN(num)) total += num;
  });

  return total;
};

    const deliveredCount = sum(delivered_vmta);
    const hardCount = sum(hard_vmta);
    const softCount = sum(soft_vmta);

    

    if (!deliveredCount && !hardCount && !softCount) {
      console.log("⚠️ No stats to update");
      return res.json({ status: "no_updates" });
    }

    const offerId = runtimeOfferId.trim();

    /* FORCE NUMBER VALUES */

  if (
  !Object.keys(delivered_vmta).length &&
  !Object.keys(delivered_isp).length &&
  !Object.keys(hard_vmta).length &&
  !Object.keys(soft_vmta).length &&
  !Object.keys(hard_isp).length &&
  !Object.keys(soft_isp).length
) {
  console.log("⚠️ No detailed stats");
  return res.json({ status: "no_detailed_updates" });
}

    const result = await Campaign.updateOne(
  { runtimeOfferId: offerId },
  {
    $set: {
      "execution.delivered": deliveredCount || 0,
      "execution.hardBounce": hardCount || 0,
      "execution.softBounce": softCount || 0,
      "execution.lastStatusUpdate": new Date(),

      // 🔥 FULL REPLACEMENT (IMPORTANT)
      "execution.vmtaStats": delivered_vmta,
      "execution.ispStats": delivered_isp,

      "execution.vmtaHard": hard_vmta,
      "execution.vmtaSoft": soft_vmta,

      "execution.ispHard": hard_isp,
      "execution.ispSoft": soft_isp
    }
  }
);

    console.log("Mongo result:", result);

    

    if (result.matchedCount === 0) {
      console.log("❌ Campaign not found:", offerId);
      return res.status(404).json({ error: "campaign_not_found" });
    }


    const HARD_FILE = "/var/www/email-core-data/bounce/hard.txt";

if (Array.isArray(hardEmails) && hardEmails.length > 0) {

  console.log("Writing hard emails to file:", hardEmails);

  const uniqueEmails = [...new Set(hardEmails)];

fs.appendFileSync(
  HARD_FILE,
  uniqueEmails.join("\n") + "\n",
    { encoding: "utf8", flag: "a" }
  );

  console.log("Hard emails written to:", HARD_FILE);
}


    return res.json({
  status: "ok",
  delivered: deliveredCount,
  hardBounce: hardCount,
  softBounce: softCount,
  vmta: delivered_vmta,
  isp: delivered_isp
});

  } catch (err) {
    console.error("UPDATE PMTA STATS ERROR:", err);
    return res.status(500).json({ error: "update_failed" });
  }
}