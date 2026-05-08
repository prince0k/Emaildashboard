import mongoose from "mongoose";

const FromLineSchema = new mongoose.Schema(
  {
    offerId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

FromLineSchema.index({ offerId: 1, text: 1 }, { unique: true });

export default mongoose.model("FromLine", FromLineSchema);