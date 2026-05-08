import mongoose from "mongoose";

const { Schema } = mongoose;

const permissionSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: /^[a-z0-9_.:]+$/,
      index: true,
    },

    description: {
      type: String,
      trim: true,
    },

    module: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: /^[a-z0-9_]+$/,
      index: true,
    },
  },
  {
    timestamps: true,
  },
  {
  name: "sender.view",
  description: "View sender servers",
  module: "sender"
},
{
  name: "sender.manage",
  description: "Create, update and delete sender servers",
  module: "sender"
}
);

export default mongoose.models.Permission ||
  mongoose.model("Permission", permissionSchema);