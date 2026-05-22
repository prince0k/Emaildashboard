function clean(str = "", max = 30) {
  return String(str)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, max);
}

export function buildRuntimeOfferId({
  server,
  sid,
  cid,
  campaignName,
  override,
}) {
  if (override) return clean(override, 80);

  if (!server || !sid || !cid || !campaignName) {
    throw new Error("runtime_offer_id_missing_required_fields");
  }

  return [
    clean(server, 10),
    clean(cid, 10),
    clean(sid, 10),
    clean(campaignName, 40)
  ]
    .filter(Boolean)
    .join("_");
}