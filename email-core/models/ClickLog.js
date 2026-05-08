import mongoose from "mongoose";

/*
  CLICK LOG
  =========
  - Tracks offer-level clicks
  - offer_id is the ONLY runtime key
  - ONE click per offer_id + email + rl + day
*/

const ClickLogSchema = new mongoose.Schema(
  {
    /* ======================
       RUNTIME IDENTITY
    ====================== */
    offer_id: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },

    campaignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Campaign",
    index: true
    },

    offerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Offer",
    index: true
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
    },

    list_id: {
      type: String,
      default: null,
      index: true,
    },
    click_count: {
      type: Number,
      default: 1
    },

    /* ======================
       SENDER META (FROM TOKEN)
    ====================== */

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
       CLICK TARGET
    ====================== */

    rl: {
      type: Number,
      required: true,
      index: true,
    },

    url: {
      type: String,
      required: true,
      trim: true,
      match: [/^https?:\/\//i, "Invalid click URL"],
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

    is_bot_click: {
      type: Boolean,
      default: false,
      index: true,
    },

    /* ======================
       NORMALIZED DAY
    ====================== */

    day: {
      type: String,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
    strict: true,
    versionKey: false,
  }
);

/* UNIQUE CLICK PER USER */
ClickLogSchema.index(
  { offer_id: 1, email: 1, rl: 1, day: 1 },
  { unique: true, partialFilterExpression: { email: { $ne: null } } }
);

/* TTL */
ClickLogSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 7776000 }
);

/* FAST REPORTING INDEXES */
ClickLogSchema.index({ offer_id: 1, day: 1 });
ClickLogSchema.index({ offer_id: 1, rl: 1, day: 1 });
ClickLogSchema.index({ offer_id: 1, day: 1, country: 1 });
ClickLogSchema.index({ offer_id:1, vmta:1 })
/* DOMAIN REPORTING */
ClickLogSchema.index({ offer_id: 1, send_domain: 1 });
/* SEGMENTATION INDEX */
ClickLogSchema.index({
 offer_id: 1,
 day: 1,
 vmta: 1,
 send_domain: 1,
 list_id: 1
});

/* EMAIL SEGMENTATION */
ClickLogSchema.index({
 offer_id: 1,
 email: 1,
 day: 1
});

/* BOT FILTER */
ClickLogSchema.index({
 offer_id: 1,
 is_bot_click: 1,
 day: 1
});
export default mongoose.models.ClickLog ||
  mongoose.model("ClickLog", ClickLogSchema);