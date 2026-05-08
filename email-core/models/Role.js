import mongoose from "mongoose";

const { Schema } = mongoose;

const roleSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },

    description: {
      type: String,
      trim: true,
    },

permissions: {
  type: [
    {
      type: Schema.Types.ObjectId,
      ref: "Permission",
    },
  ],
  validate: {
    validator: function (value) {
      return Array.isArray(value);
    },
    message: "Permissions must be an array",
  },
},

    isSystem: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Role ||
  mongoose.model("Role", roleSchema);