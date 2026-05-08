import Deploy from "../models/Deploy.js";

export async function checkActiveDeploy(sid) {
  if (!sid) return false;

  const active = await Deploy.findOne({
    sid,
    status: "DEPLOYED",
  }).lean();

  return !!active;
}
