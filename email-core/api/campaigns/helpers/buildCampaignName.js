function clean(str = "", max = 30) {
  return String(str)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "_")   // allow only a-z0-9
    .replace(/_+/g, "_")          // collapse multiple _
    .replace(/^_|_$/g, "")        // trim _
    .slice(0, max);
}

export function buildCampaignName({
  isp,
  offer,
  cid,
  sid,
  server,
  user,
}) {
  const now = new Date();

  const dateStr =
    now.getUTCFullYear().toString() +
    String(now.getUTCMonth() + 1).padStart(2, "0") +
    String(now.getUTCDate()).padStart(2, "0");

  return [
    clean(isp, 15),
    clean(offer, 20),
    clean(sid, 15),
    clean(cid, 15),
    dateStr,
    `by_${clean(user, 15)}`,
    `srv_${clean(server, 15)}`
  ]
    .filter(Boolean)
    .join("_");
}