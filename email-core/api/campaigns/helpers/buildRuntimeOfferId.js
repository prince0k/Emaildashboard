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
  user,
  override,
}) {

  if (override) return clean(override, 80);

  if (!server || !sid || !cid || !user) {
    throw new Error("runtime_offer_id_missing_required_fields");
  }

  const now = new Date();

  const dateStr =
    now.getUTCFullYear().toString() +
    String(now.getUTCMonth() + 1).padStart(2, "0") +
    String(now.getUTCDate()).padStart(2, "0");

  const random5 = Math.floor(Math.random() * 100000)
    .toString()
    .padStart(5, "0");

  return [
    clean(server, 15),
    clean(sid, 15),
    clean(cid, 15),
    clean(user, 15),
    dateStr,
    random5
  ]
    .filter(Boolean)
    .join("_");
}