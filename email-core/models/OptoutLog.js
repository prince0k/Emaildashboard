import mongoose from "mongoose";

/*
  OPTOUT LOG (OFFER LEVEL — PERMANENT)
  ==================================
  - One record per offer_id + normalized email
  - Permanent (no TTL)
  - day is reporting metadata
*/

const OptoutLogSchema = new mongoose.Schema(
  {
    /* ======================
       IDENTITY (IMMUTABLE)
    ====================== */
    offer_id: {
      type: String,
      required: true,
      trim: true,
      index: true,
      immutable: true,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      immutable: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email"],
    },

    list_id: {
      type: String,
      default: null,
      index: true,
    },

    vmta: {
      type: String,
      default: null,
      index: true,
    },

    url: {
      type: String,
      trim: true,
      match: [/^https?:\/\//i, "Invalid URL"],
      default: null,
    },

    /* ======================
       NETWORK
    ====================== */
    ip: {
      type: String,
      default: null,
    },

    country: {
      type: String,
      default: null,
      index: true,
    },

    /* ======================
       META
    ====================== */
    userAgent: {
      type: String,
      default: null,
    },

    source: {
      type: String,
      default: "affiliate-link",
    },

    reason: {
      type: String,
      default: "offer-optout",
    },

    send_domain: {
      type: String,
      default: null,
      index: true
    },

    /* ======================
       REPORTING
    ====================== */
    day: {
      type: String, // YYYY-MM-DD
      index: true,
      required: true,
      match: [/^\d{4}-\d{2}-\d{2}$/, "Invalid day format"],
    },
  },
  {
    timestamps: true,
    strict: true,
    versionKey: false,
  }
);

/* ======================
   🔒 PERMANENT OPTOUT
====================== */
OptoutLogSchema.index(
  { offer_id: 1, email: 1 },
  { unique: true }
);

/* ======================
   REPORTING SPEED
====================== */
OptoutLogSchema.index({ offer_id: 1, day: 1 });
OptoutLogSchema.index({ offer_id: 1, list_id: 1, day: 1 });

export default mongoose.models.OptoutLog ||
  mongoose.model("OptoutLog", OptoutLogSchema);