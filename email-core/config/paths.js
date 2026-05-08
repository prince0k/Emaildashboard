import path from "path";

/*
  PATH CONFIG — LOCKED (NO SIDE EFFECTS)
  =====================================
  - Defines filesystem layout only
  - NO directory creation
  - NO fs calls
  - Immutable paths
*/

export const DATA_ROOT =
  process.env.DATA_ROOT || "/var/www/email-core-data";

if (!path.isAbsolute(DATA_ROOT)) {
  throw new Error("DATA_ROOT must be an absolute path");
}

export const PATHS = Object.freeze({
  /* ========= CORE ========= */
  segments: path.join(DATA_ROOT, "segments"),
  output: path.join(DATA_ROOT, "output"),

  /* ========= CREATIVE ASSETS ========= */
  creativeAssets: path.join(DATA_ROOT, "creative_assets"),

  /* ===== SUPPRESSION ===== */
  md5: path.join(DATA_ROOT, "md5offeroptout"),
  unsub: path.join(DATA_ROOT, "unsubscribe"),
  global: path.join(DATA_ROOT, "global"),
  bounce: path.join(DATA_ROOT, "bounce"),
  complaint: path.join(DATA_ROOT, "complaint"),
});
