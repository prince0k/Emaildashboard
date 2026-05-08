import mongoose from "mongoose";

const ComplaintLogSchema = new mongoose.Schema(
  {
    offer_id: {
      type: String,
      required: true,
      index: true,
    },

    email: {
      type: String,
      lowercase: true,
      trim: true,
      index: true,
    },

    day: {
      type: String, // YYYY-MM-DD
      required: true,
      index: true,
    },

    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { versionKey: false }
);

// 🔥 unique per email per offer
ComplaintLogSchema.index(
  { offer_id: 1, email: 1 },
  { unique: true }
);

export default mongoose.models.ComplaintLog ||
  mongoose.model("ComplaintLog", ComplaintLogSchema);