import mongoose from "mongoose";

const SubjectLineSchema = new mongoose.Schema(
  {
    offerId: { type: mongoose.Schema.Types.ObjectId, ref: "Offer", required: true },
    text: { type: String, required: true }
  },
  { timestamps: true }
);

SubjectLineSchema.index({ offerId: 1, text: 1 }, { unique: true });

export default mongoose.model("SubjectLine", SubjectLineSchema);
