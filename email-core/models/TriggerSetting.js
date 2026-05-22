import mongoose from "mongoose";

const { Schema } = mongoose;

const TriggerSettingSchema = new Schema(
  {
    triggerType: {
      type: String,
      required: true,
      unique: true, // e.g., 'WELCOME', 'VERIFICATION'
      trim: true,
      uppercase: true
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SenderServer",
      required: true
    },
    routeId: {
      type: String, // We store the sub-document _id of the route
      required: true
    },
    active: {
      type: Boolean,
      default: true
    },
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  },
  { timestamps: true }
);

export default mongoose.model("TriggerSetting", TriggerSettingSchema);
