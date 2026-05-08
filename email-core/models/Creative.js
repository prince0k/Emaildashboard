import mongoose from "mongoose";

const CreativeSchema = new mongoose.Schema(
  {
    offerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Offer",
      required: true,
    },
    name: { type: String, required: true },
    html: { type: String, required: true },
    status: {
      type: String,
      enum: ["active", "paused"],
      default: "paused",
    },

    // 🔥 Add these
    isDeleted: { type: Boolean, default: false },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model("Creative", CreativeSchema);