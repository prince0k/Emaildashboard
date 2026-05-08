import mongoose from "mongoose";

/*
  UNSUBSCRIBE LOG (EVENT LEVEL)
  ============================
  - Daily unsubscribe EVENTS
  - Best-effort dedupe by email (when available)
  - Anonymous events are NOT deduped
*/

const UnsubLogSchema = new mongoose.Schema(
  {
    /* ======================
       CONTEXT
    ====================== */
    offer_id: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    cid: {
      type: String,
      trim: true,
      index: true,
      default: null,
    },

    /* ======================
       USER IDENTITY
    ====================== */
    email: {
      type: String,
      lowercase: true,
      trim: true,
      default: null,
      index: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email"],
    },

    ip: {
      type: String,
      default: null,
      index: true,
    },

    country: {
      type: String,
      default: null,
      index: true,
    },

    /* ======================
       META
    ====================== */
    server: {
      type: String,
      default: null,
    },

    userAgent: {
      type: String,
      default: null,
    },

    source: {
      type: String, // header | link | one-click
      default: "link",
    },

    send_domain: {
      type: String,
      default: null,
      index: true
    },

    vmta: {
      type: String,
      default: null,
      index: true
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
    versionKey: false,
    strict: true,
  }
);

/* ======================
   EMAIL-BASED DEDUPE
   Only when email exists
====================== */
UnsubLogSchema.index(
  { offer_id: 1, day: 1, email: 1 },
  {
    unique: true,
    partialFilterExpression: { email: { $type: "string" } },
  }
);

/* ======================
   REPORTING SPEED
====================== */
UnsubLogSchema.index({ cid: 1, day: 1 });
UnsubLogSchema.index({ offer_id: 1, day: 1 });
UnsubLogSchema.index({ email: 1, day: -1 });

export default mongoose.models.UnsubLog ||
  mongoose.model("UnsubLog", UnsubLogSchema);