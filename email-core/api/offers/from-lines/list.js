import { listFromLines } from "../../../services/fromLineService.js";

export default async (req, res) => {
  res.json(await listFromLines(req.query.offerId));
};
