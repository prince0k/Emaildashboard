import mongoose from "mongoose";
import bcrypt from "bcrypt";
import Counter from "./Counter.js";

const { Schema } = mongoose;

const UserSchema = new Schema(
  {
    // 🔥 Business Unique ID
    userId: {
      type: String,
      unique: true,
      index: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email address"],
      index: true,
    },

    password: {
      type: String,
      required: true,
      select: false,
    },

    role: {
      type: Schema.Types.ObjectId,
      ref: "Role",
      required: true,
    },

    extraPermissions: [
      {
        type: Schema.Types.ObjectId,
        ref: "Permission",
      },
    ],

    active: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

/* ======================
   AUTO GENERATE UNIQUE USER ID
====================== */
UserSchema.pre("save", async function (next) {
  if (!this.isNew) return next();

  try {
    const counter = await Counter.findOneAndUpdate(
      { name: "userId" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    const padded = String(counter.seq).padStart(5, "0");
    this.userId = `USR${padded}`;

    next();
  } catch (err) {
    next(err);
  }
});

/* ======================
   PASSWORD HASHING
====================== */
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }

  try {
    const saltRounds = 12;
    this.password = await bcrypt.hash(this.password, saltRounds);
    next();
  } catch (err) {
    next(err);
  }
});

/* ======================
   PASSWORD COMPARE
====================== */
UserSchema.methods.comparePassword = async function (plainPassword) {
  return bcrypt.compare(plainPassword, this.password);
};


export default mongoose.models.User ||
  mongoose.model("User", UserSchema);