import SubjectLine from "../models/SubjectLine.js";

export const listSubjectLines = (offerId) =>
  SubjectLine.find({ offerId });

export const createSubjectLine = (data) =>
  SubjectLine.create(data);

export const updateSubjectLine = (id, data) =>
  SubjectLine.findByIdAndUpdate(id, data, { new: true });

export const deleteSubjectLine = (id) =>
  SubjectLine.findByIdAndDelete(id);

export async function bulkCreateSubjectLines(offerId, lines) {
  // Remove already existing subject lines in DB
  const existing = await SubjectLine.find({
    offerId,
    text: { $in: lines }
  }).select("text");

  const existingTexts = existing.map(item => item.text);

  const newLines = lines.filter(line => !existingTexts.includes(line));

  if (newLines.length === 0) {
    return { message: "No new subject lines to insert", inserted: 0 };
  }

  const docs = newLines.map(text => ({
    offerId,
    text
  }));

  await SubjectLine.insertMany(docs);

  return {
    message: "Bulk insert successful",
    inserted: docs.length
  };
}