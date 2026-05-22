import mongoose from "mongoose";

const CampaignTriggerSchema = new mongoose.Schema(
  {
    parentCampaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign",
      required: true,
      index: true,
    },

    triggerType: {
      type: String,
      enum: ["OPEN", "CLICK"],
      default: "OPEN",
      required: true,
    },

    // FOLLOW UP CONFIG
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SenderServer",
      required: true,
    },

    routeId: {
      type: String,
      required: true,
    },

    offerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Offer",
      required: true,
    },

    creativeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Creative",
      required: true,
    },

    subjectIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubjectLine",
    }],

    fromIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "FromLine",
    }],

    isp: {
      type: String,
      required: true,
    },

    active: {
      type: Boolean,
      default: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

// Ensure only one trigger of same type per campaign
CampaignTriggerSchema.index({ parentCampaignId: 1, triggerType: 1 }, { unique: true });

export default mongoose.model("CampaignTrigger", CampaignTriggerSchema);
