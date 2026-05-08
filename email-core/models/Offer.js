import mongoose from "mongoose";

const OfferSchema = new mongoose.Schema(
  {
    /* ======================
       CORE IDENTIFIERS
    ====================== */
    sid: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    sponsor: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    cid: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    offer: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    vid: {
      type: String,
      trim: true,
    },

    vertical: {
      type: String,
      trim: true,
      lowercase: true,
    },

    /* ======================
       LINKS
    ====================== */
    redirectLinks: {
      type: [String],
      required: true,
      validate: {
        validator: (v) =>
          Array.isArray(v) &&
          v.length > 0 &&
          v.every(
            (link) =>
              typeof link === "string" &&
              /^https?:\/\//i.test(link.trim())
          ),
        message: "redirectLinks must be a non-empty array of valid URLs",
      },
    },

    optoutLink: {
      type: String,
      required: true,
      trim: true,
      match: [/^https?:\/\//i, "Invalid optout link"],
    },

    /* ======================
       MD5 / OPTIZMO
    ====================== */
    optizmoAccessKey: {
      type: String,
      trim: true,
      index: true,
    },

    optizmoZipName: {
      type: String,
      trim: true,
      lowercase: true,
    },

    md5FileName: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
    },

    /* ======================
       STATE
    ====================== */
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

/* ======================
   INDEXES
====================== */
OfferSchema.index(
  { sponsor: 1, cid: 1, offer: 1 },
  { unique: true }
);

OfferSchema.index({ isActive: 1, isDeleted: 1 });

/* ======================
   STATE SAFETY
====================== */
OfferSchema.pre("save", function (next) {
  if (this.isDeleted) {
    this.isActive = false;
  }
  next();
});

export default mongoose.model("Offer", OfferSchema);
