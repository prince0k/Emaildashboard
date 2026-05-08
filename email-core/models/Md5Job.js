import mongoose from "mongoose";

const Md5JobSchema = new mongoose.Schema({
  jobId: String,
  status: {
    type: String,
    enum: ["running", "completed", "failed"],
    default: "running",
  },
  total: { type: Number, default: 0 },
  processed: { type: Number, default: 0 },
  success: { type: Number, default: 0 },
  failed: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model("Md5Job", Md5JobSchema);