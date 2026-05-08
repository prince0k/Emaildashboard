import FromLine from "../models/FromLine.js";

export const listFromLines = (offerId) =>
  FromLine.find({ offerId });

export const createFromLine = (data) =>
  FromLine.create(data);

export const updateFromLine = (id, data) =>
  FromLine.findByIdAndUpdate(id, data, { new: true });

export const deleteFromLine = (id) =>
  FromLine.findByIdAndDelete(id);
export async function bulkCreateFromLines(offerId, lines) {
  const existing = await FromLine.find({
    offerId,
    text: { $in: lines }
  }).select("text");

  const existingTexts = existing.map(i => i.text);

  const newLines = lines.filter(line => !existingTexts.includes(line));

  if (newLines.length === 0) {
    return { message: "No new from lines", inserted: 0 };
  }

  const docs = newLines.map(text => ({
    offerId,
    text
  }));

  await FromLine.insertMany(docs);

  return {
    message: "Bulk insert successful",
    inserted: docs.length
  };
}