import mongoose from "mongoose";

/* ======================
   ROUTE STRUCTURE
====================== */
const RouteSchema = new mongoose.Schema(
  {
    from_user: { type: String, required: true, trim: true },
    domain: { type: String, required: true, trim: true },
    vmta: { type: String, required: true, trim: true },
  },
  { _id: false }
);

/* ======================
   SUPPRESSION SNAPSHOT
====================== */
const SuppressionSchema = new mongoose.Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SuppressionJob",
      index: true
    },

    status: {
      type: String,
      enum: ["PENDING", "RUNNING", "COMPLETED", "FAILED", "USED"],
      default: "PENDING",
      index: true
    },

    outputFile: String,
    statsFile: String,
    statsPath: String,

    inputCount: { type: Number, default: 0 },
    finalCount: { type: Number, default: 0, index: true },
    removedCount: { type: Number, default: 0 },

    breakdown: {
      input: { type: Number, default: 0 },
      invalid: { type: Number, default: 0 },
      duplicates: { type: Number, default: 0 },
      offer_md5: { type: Number, default: 0 },
      global: { type: Number, default: 0 },
      unsubscribe: { type: Number, default: 0 },
      complaint: { type: Number, default: 0 },
      domain_complaint: { type: Number, default: 0 },
      domain_unsub: { type: Number, default: 0 },
      bounce: { type: Number, default: 0 },
      exclusion_removed: { type: Number, default: 0 },
      inclusion_added: { type: Number, default: 0 },
      kept: { type: Number, default: 0 },
    },
  },
  { _id: false }
);

/* ======================
   SEND CONFIG SNAPSHOT
====================== */
const SendConfigSchema = new mongoose.Schema(
  {
    // ===== CORE =====
    mode: {
      type: String,
      enum: ["TEST", "LIVE"],
      required: true,
    },

    // ===== BASIC FIELDS =====
    subject: String,
    fromName: String,
    subjectIds: [String],
    fromIds: [String],

    trackingMode: {
      type: String,
      enum: ["from", "domain"],
      default: "from",
    },

    trackingDomain: String,

    aliases: {
      type: [String],
      default: [],
    },

    seeds: {
      type: [String],
      default: [],
    },

    // ===== SEND CONTROL =====
    totalSend: Number,
    sendInSeconds: Number,
    sendInMinutes: Number,
    sendInHours: Number,

    // ===== TEST MODE =====
    testRoutes: Number,
    testSeeds: Number,
    testTotalSend: Number,

    // ===== SEED INJECTION =====
    seedAfter: {
      type: Number,
      default: 0,
    },

    seedMode: {
      type: String,
      enum: ["round", "random"],
      default: "round",
    },

    // ===== FORMAT =====
    contentMode: {
      type: String,
      enum: ["html", "multipart"],
      default: "multipart",
    },

    textEncoding: {
      type: String,
      enum: ["base64", "quoted-printable", "7bit", "8bit"],
      default: "base64",
    },

    htmlEncoding: {
      type: String,
      enum: ["base64", "quoted-printable", "7bit", "8bit"],
      default: "base64",
    },

    // ===== ENVELOPE =====
    envelopeMode: {
      type: String,
      enum: ["route", "random", "custom"],
      default: "route",
    },

    envelopeCustomType: {
      type: String,
      enum: ["fixed", "pattern"],
    },

    envelopeCustomEmail: String,
    envelopeCustomDomain: String,
    envelopePatternBlocks: Number,
    envelopePatternLength: Number,

    // ===== HEADER =====
    headerMode: {
      type: String,
      enum: ["route", "random", "custom"],
      default: "route",
    },

    headerCustomType: {
      type: String,
      enum: ["fixed", "pattern"],
    },

    headerCustomEmail: String,
    headerCustomDomain: String,
    headerPatternBlocks: Number,
    headerPatternLength: Number,

    // ===== HEADER BLOCK =====
    headerBlockMode: {
      type: String,
      enum: ["default", "custom"],
      default: "default",
    },

    customHeaderBlock: String,

    // ===== META =====
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  {
    _id: false,
    strict: true, // 🔥 important (ignore unknown fields)
  }
);

/* ======================
   EXECUTION METRICS
====================== */
const ExecutionSchema = new mongoose.Schema({
  delivered: { type: Number, default: 0 },
  totalSent: { type: Number, default: 0 },
  failures: { type: Number, default: 0 },
  hardBounce: { type: Number, default: 0 },
  softBounce: { type: Number, default: 0 },

  vmtaStats: { type: Object, default: {} },
ispStats: { type: Object, default: {} },

vmtaHard: { type: Object, default: {} },
vmtaSoft: { type: Object, default: {} },

ispHard: { type: Object, default: {} },
ispSoft: { type: Object, default: {} },

  startedAt: Date,
  completedAt: Date,
  lastStatusUpdate: Date,
}, { _id: false });

/* ======================
   MAIN CAMPAIGN SCHEMA
====================== */
const CampaignSchema = new mongoose.Schema(
  {
    campaignName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },

    offerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Offer",
      required: false, // 🔥 Relaxed for drafts
      index: true,
    },

    creativeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Creative",
      required: false,
      index: true,
    },

runtimeOfferId: {
  type: String,
  required: false, // 🔥 Relaxed for drafts
  unique: true,
  sparse: true,   // 🔥 required because multiple nulls/empty would conflict
  index: true,
},

isDeleted: {
  type: Boolean,
  default: false,
},
deletedAt: Date,


    creativeVersion: {
      type: Number,
      default: 1,
    },
    
    htmlOverride: {
      type: String,
      default: null,
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SenderServer",
      required: false, // 🔥 Relaxed for drafts
      index: true,
    },

createdBy: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "User",
  required: false,
  index: true,
},

liveExecuted: {
  type: Boolean,
  default: false,
  index: true,
},

/* 🔥 NEW — SCHEDULING FIELD */
scheduledAt: {
  type: Date,
  index: true,
},

/* 🔥 NEW — TRIGGER FIELD */
openTriggerCampaignId: {
  type: String,
  default: null,
  index: true,
},

    isp: {
      type: String,
      trim: true,
      index: true,
    },

    segmentName: {
      type: String,
      required: false,
      index: true,
    },

    routes: {
      type: [RouteSchema],
      default: [],
    },

    trackingMode: {
      type: String,
      enum: ["from", "domain"],
      default: "from",
    },

trackingDomain: {
  type: String,
  trim: true,
  validate: {
    validator: function (value) {
      if (this.trackingMode === "domain") {
        return typeof value === "string" && value.trim().length > 0;

      }
      return true;
    },
    message: "trackingDomain required when trackingMode is domain",
  },
},


    status: {
      type: String,
      enum: [
        "DRAFT", // 🔥 ADDED
        "CREATED",
        "SCHEDULED",
        "DEPLOYED",
        "TESTED",
        "RUNNING",
        "PAUSED",
        "STOPPED",
        "SENT",
        "COMPLETED",
        "FAILED",
      ],
      default: "CREATED",
      index: true,
    },


    /* ===== SUPPRESSION CONFIG (set in Step 3 UI) ===== */
    suppressionConfig: {
      queueDomain: { type: String, default: null },
      skipUnsub: { type: Boolean, default: false },
      inclusionSegments: [{
        filename: { type: String, required: true },
        limit: { type: Number, default: 0 },
      }],
      exclusionSegments: [{
        filename: { type: String, required: true },
        limit: { type: Number, default: 0 },
      }],
    },

    suppression: SuppressionSchema,
    suppressionRunAt: { type: Date, index: true },

    deployedAt: { type: Date, index: true },
    testedAt: { type: Date, index: true },
    sentAt: { type: Date, index: true },

    sendConfig: SendConfigSchema,
    execution: {
  type: ExecutionSchema,
  default: () => ({}),
},

    environment: {
      type: String,
      enum: ["production", "staging"],
      default: "production",
    },
  },
  {
    timestamps: true,
    versionKey: false, // 🚀 Disable versioning to prevent "No matching document found" errors
  }
);

/* ======================
   INDEX OPTIMIZATION
====================== */


// sender + status reporting
CampaignSchema.index({ sender: 1, status: 1 }); 

// scheduling lookup
CampaignSchema.index(
  { scheduledAt: 1 },
  { partialFilterExpression: { status: "SCHEDULED" } }
);

CampaignSchema.index({ runtimeOfferId: 1, sender: 1 });
// reporting
CampaignSchema.index({ createdAt: -1 });
CampaignSchema.index({ offerId: 1, createdAt: -1 });

export default mongoose.model("Campaign", CampaignSchema);
