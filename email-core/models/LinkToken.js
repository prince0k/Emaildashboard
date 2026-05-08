import mongoose from "mongoose";

const LinkTokenSchema = new mongoose.Schema(
  {
    /* ======================
       STATIC (ON CREATE)
    ====================== */

    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
      immutable: true,
    },

    type: {
      type: String,
      enum: ["open", "click", "optout", "unsub"],
      required: true,
      index: true,
      immutable: true,
    },

    offer_id: {
      type: String,
      default: null,
      index: true,
      immutable: true,
    },

    email: {
      type: String,
      default: null,
      lowercase: true,
      trim: true,
      index: true,
    },

    rl: {
      type: Number,
      default: null,
      immutable: true,
    },

    list_id: {
      type: String,
      default: null,
      index: true,
    },

    // 🔥 sender metadata
    send_domain: {
      type: String,
      default: null,
      index: true,
    },

    vmta: {
      type: String,
      default: null,
      index: true,
    },

    /* ======================
       DYNAMIC (ON EVENT)
    ====================== */

    open_count: {
      type: Number,
      default: 0,
    },

    click_count: {
      type: Number,
      default: 0,
    },

    first_open_at: Date,
    last_open_at: Date,

    first_click_at: Date,
    last_click_at: Date,

    open_ip: String,
    click_ip: String,

    open_ua: String,
    click_ua: String,

    is_bot_open: {
      type: Boolean,
      default: false,
    },

    is_bot_click: {
      type: Boolean,
      default: false,
    },

    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    complaint: {
      type: Boolean,
      default: false,
      index: true,
    },
    complaintAt: Date,
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

/* ======================
   TTL INDEX
====================== */

LinkTokenSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 }
);

export default mongoose.models.LinkToken ||
  mongoose.model("LinkToken", LinkTokenSchema);