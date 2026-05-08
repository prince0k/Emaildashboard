import mongoose from "mongoose";

const domainSchema = new mongoose.Schema({

  server: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "SenderServer",
    required: true,
    unique: true,
    index: true
  },

  domains: [
    {
      domain: {
        type: String,
        required: true
      },

      sent: {
        type: Number,
        default: 0
      },

      delivered: {
        type: Number,
        default: 0
      },

      bounced: {
        type: Number,
        default: 0
      }
    }
  ],

  updatedAt: {
    type: Date,
    default: Date.now
  }

});

export default mongoose.model("PmtaDomains", domainSchema);