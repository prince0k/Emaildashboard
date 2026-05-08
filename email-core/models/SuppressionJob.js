import mongoose from "mongoose";

/* ---------- COUNTS ---------- */
const CountsSchema = new mongoose.Schema(
  {
    input: { type: Number, default: 0 },
    invalid: { type: Number, default: 0 },
    offer_md5: { type: Number, default: 0 },
    global: { type: Number, default: 0 },
    unsubscribe: { type: Number, default: 0 },
    complaint: { type: Number, default: 0 },
    bounce: { type: Number, default: 0 },
    duplicates: { type: Number, default: 0 },
    kept: { type: Number, default: 0 },
  },
  { _id: false }
);

/* ---------- JOB ---------- */
const SuppressionJobSchema = new mongoose.Schema(
  {
    /* ---------- REAL RELATION ---------- */
    offerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Offer",
      index: true,
      required: true,
    },

    /* ---------- LEGACY / DEBUG ---------- */
    sid: { type: String, index: true },

    /* ---------- SNAPSHOT (HISTORY NEVER BREAKS) ---------- */
    sponsor: String,
    cid: String,
    offer: String,

    /* ---------- INPUT ---------- */
    inputFile: { type: String, required: true },
    md5FileName: String,

    /* ---------- COUNTS ---------- */
    counts: {
      type: CountsSchema,
      default: () => ({}),
    },

    finalCount: {
      type: Number,
      default: 0,
      index: true,
    },

    /* ---------- STATUS ---------- */
    status: {
      type: String,
      enum: ["RUNNING", "DONE", "FAILED", "USED"],
      default: "RUNNING",
      index: true,
    },

    usedByCampaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign",
      index: true
    },

    usedAt: Date,

    /* ---------- FILES ---------- */
    outputFile: String,
    statsPath: String,

    /* ---------- ERROR ---------- */
    errorMessage: String,

    /* ---------- CAMPAIGN USAGE ---------- */

    usedAt: Date,
    
    /* ---------- AUDIT ---------- */

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

/* ---------- KEEP finalCount IN SYNC ---------- */
SuppressionJobSchema.pre("save", function (next) {
  if (
    this.counts &&
    typeof this.counts.kept === "number" &&
    this.finalCount !== this.counts.kept
  ) {
    this.finalCount = this.counts.kept;
  }
  next();
});

export default mongoose.model("SuppressionJob", SuppressionJobSchema);
