import mongoose from "mongoose";

const { Schema } = mongoose;

const RouteSchema = new Schema(
  {
    vmta: {
      type: String,
      required: true,
      trim: true,
    },
    domain: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    from_user: {
      type: String,
      required: true,
      trim: true,
    },
    trackingDomain: {
      type: String,
      trim: true,
      lowercase: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { _id: true }
);

const SenderServerSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    provider: {
      type: String,
      trim: true,
      default: "custom",
    },
    baseUrl: {
      type: String,
      required: true,
      trim: true,
    },

    dba: {
      type: String,
      trim: true,
      lowercase: true,
    },

    routes: {
      type: [RouteSchema],
      default: [],
    },
    pmta: {
      host: {
        type: String,
        trim: true
      },
      sshUser: {
        type: String,
        trim: true
      },
      sshPort: {
        type: Number,
        default: 22
      },
      sshKeyPath: {
        type: String,
        trim: true
      },
      apiPort: {
        type: Number,
        default: 8080
      }
    },
    active: {
      type: Boolean,
      default: true,
    },
    priority: {
      type: Number,
      default: 1,
    },
    notes: {
      type: String,
      trim: true,
    },
    stats: {
      totalSent: { type: Number, default: 0 },
      totalBounce: { type: Number, default: 0 },
      totalComplaints: { type: Number, default: 0 },
      lastUsedAt: { type: Date },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

SenderServerSchema.index({ active: 1 });
SenderServerSchema.index({ priority: -1 });
SenderServerSchema.index({ "routes.domain": 1 });
SenderServerSchema.index({ "routes.vmta": 1 });

export default mongoose.model("SenderServer", SenderServerSchema);