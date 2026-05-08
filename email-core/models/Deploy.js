import mongoose from "mongoose";

/*
  DEPLOY MODEL — FINAL

  - ONE ACTIVE DEPLOY PER runtime offer_id
  - SAME offer (sid) can be deployed multiple times
  - Snapshot is IMMUTABLE
  - History is append-only
*/

const DeploySchema = new mongoose.Schema(
  {
    /* ======================
       RUNTIME TRACKING ID
       (PUBLIC — USED IN LINKS)
    ====================== */
    offer_id: {
      type: String,
      required: true,
      trim: true,
      immutable: true,
      index: true,
    },

    /* ======================
       OFFER MASTER ID
    ====================== */
    sid: {
      type: String,
      required: true,
      immutable: true,
      index: true,
    },

    /* ======================
       OFFER SNAPSHOT (IMMUTABLE)
    ====================== */
    sponsor: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      immutable: true,
    },

    cid: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      immutable: true,
    },

    offer: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      immutable: true,
    },

    vid: {
      type: String,
      immutable: true,
      trim: true,
    },

    vertical: {
      type: String,
      immutable: true,
      lowercase: true,
      trim: true,
    },

    /* ======================
       SENDING SNAPSHOT
    ====================== */
    redirectLinks: {
      type: [String],
      required: true,
      immutable: true,
      validate: {
        validator: (v) =>
          Array.isArray(v) &&
          v.length > 0 &&
          v.every(
            (link) =>
              typeof link === "string" &&
              /^https?:\/\//i.test(link.trim())
          ),
        message: "redirectLinks must be valid HTTP/HTTPS URLs",
      },
    },

    optoutLink: {
      type: String,
      required: true,
      immutable: true,
      trim: true,
      match: [/^https?:\/\//i, "Invalid optout link"],
    },

    md5FileName: {
      type: String,
      required: true,
      immutable: true,
      trim: true,
      lowercase: true,
    },

    /* ======================
       DEPLOY STATE
    ====================== */
    status: {
      type: String,
      enum: ["DEPLOYED", "UNDEPLOYED"],
      default: "DEPLOYED",
      index: true,
    },

    deployedAt: {
      type: Date,
      default: Date.now,
      immutable: true,
      index: true,
    },

    undeployedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    strict: true,
  }
);

/* ======================
   🔒 HARD LOCK
   ONE ACTIVE DEPLOY PER runtime offer_id
====================== */
DeploySchema.index(
  { offer_id: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "DEPLOYED" },
  }
);

/* ======================
   STATE CONSISTENCY
====================== */
DeploySchema.pre("save", function (next) {
  if (this.status === "UNDEPLOYED" && !this.undeployedAt) {
    this.undeployedAt = new Date();
  }

  if (this.status === "DEPLOYED") {
    this.undeployedAt = undefined;
  }

  next();
});

export default mongoose.model("Deploy", DeploySchema);
