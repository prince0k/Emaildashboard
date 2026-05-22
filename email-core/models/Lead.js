import mongoose from "mongoose";

const leadSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, index: true },
    name: { type: String, default: "" },
    siteName: { type: String, default: "" },
    siteUrl: { type: String, default: "" },
    sender: { type: String, default: "" },
    route: { type: String, default: "" },
    messageId: { type: String, default: null },
    status: { type: String, enum: ["SENT", "FAILED", "VERIFY_SENT", "VERIFY_FAILED"], default: "SENT" },
    error: { type: String, default: null },
    createdAt: { type: Date, default: Date.now, index: true },
  },
  {
    timestamps: true,
  }
);

// Index for daily/monthly reporting
leadSchema.index({ createdAt: -1 });

export default mongoose.model("Lead", leadSchema);
