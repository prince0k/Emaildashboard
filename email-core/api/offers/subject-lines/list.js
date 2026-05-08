import { listSubjectLines } from "../../../services/subjectLineService.js";

export default async (req, res) => {
  res.json(await listSubjectLines(req.query.offerId));
};
