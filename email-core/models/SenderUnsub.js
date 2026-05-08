import mongoose from "mongoose";

/*
  GLOBAL SENDER-LEVEL UNSUBSCRIBE
  ==============================
  - Permanent
  - One record per normalized email
  - Hard suppression (highest priority)
*/

const SenderUnsubSchema = new mongoose.Schema(
  {
    /* ======================
       IDENTITY (IMMUTABLE)
    ====================== */
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      immutable: true,
      unique: true,
      index: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email"],
    },

    /* ======================
       NETWORK
    ====================== */
    ip: {
      type: String,
      default: null,
    },

    userAgent: {
      type: String,
      default: null,
    },

    source: {
      type: String, // one-click | header | manual
      default: "one-click",
    },

    /* ======================
       REPORTING
    ====================== */
    day: {
      type: String, // YYYY-MM-DD
      required: true,
      index: true,
      match: [/^\d{4}-\d{2}-\d{2}$/, "Invalid day format"],
    },
  },
  {
    timestamps: true,
    strict: true,
    versionKey: false,
  }
);

/* ---------- HARD UNIQUE GUARANTEE ---------- */
SenderUnsubSchema.index({ email: 1 }, { unique: true });

export default mongoose.models.SenderUnsub ||
  mongoose.model("SenderUnsub", SenderUnsubSchema);
