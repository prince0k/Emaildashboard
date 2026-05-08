import mongoose from "mongoose";

const OpenLogSchema = new mongoose.Schema(
  {
    offer_id: { type: String, index: true }, // runtimeOfferId

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

    email: {
      type: String,
      default: null,
      lowercase: true,
      trim: true,
      index: true,
    },

    token: {
      type: String,
      default: null,
      index: true,
    },

    /* SENDER META */

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

    list_id: {
      type: String,
      default: null,
      index: true,
    },

    /* CLIENT META */

    ip: {
      type: String,
      default: null,
    },

    userAgent: {
      type: String,
      default: null,
    },

    country: {
      type: String,
      default: null,
      index: true,
    },

    day: {
      type: Date,
      required: true,
      index: true,
    },

    /* METRICS */

    unique_open_count: {
      type: Number,
      default: 0,
    },

    total_open_count: {
      type: Number,
      default: 0,
    },

    bot_open_count: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

/* FAST ANALYTICS */
OpenLogSchema.index({ offer_id: 1, day: 1 });
OpenLogSchema.index({ offer_id: 1, day: 1, country: 1 });
OpenLogSchema.index({ offer_id:1, vmta:1 })
/* DOMAIN REPORTING */
OpenLogSchema.index({ offer_id: 1, send_domain: 1 });

/* UNIQUE OPEN */
OpenLogSchema.index(
  { offer_id: 1, email: 1, day: 1 },
  { unique: true, partialFilterExpression: { email: { $ne: null } } }
);

OpenLogSchema.index(
  { offer_id: 1, token: 1 },
  { unique: true, partialFilterExpression: { token: { $ne: null } } }
);

/* TTL */
OpenLogSchema.index(
  { day: 1 },
  { expireAfterSeconds: 7776000 }
);

/* SEGMENTATION INDEX */
OpenLogSchema.index({
  offer_id: 1,
  day: 1,
  vmta: 1,
  send_domain: 1,
  list_id: 1
});

/* EMAIL SEGMENTATION */
OpenLogSchema.index({
  offer_id: 1,
  email: 1,
  day: 1
});

OpenLogSchema.index({
  offer_id: 1,
  vmta: 1,
  send_domain: 1,
  day: 1
});

/* BOT FILTER */
OpenLogSchema.index({
  offer_id: 1,
  bot_open_count: 1,
  day: 1
});

export default mongoose.models.OpenLog ||
  mongoose.model("OpenLog", OpenLogSchema);