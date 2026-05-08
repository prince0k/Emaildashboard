import { toggleCreativeStatus } from "../../../services/creativeService.js";

export default async (req, res) => {
  const { id, status } = req.body;
  res.json(await toggleCreativeStatus(id, status));
};
