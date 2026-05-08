import { getCreatives } from "../../../services/creativeService.js";

export default async (req, res) => {
  const { offerId } = req.query;
  res.json(await getCreatives(offerId));
};
