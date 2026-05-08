import mongoose from "mongoose";

const schema = new mongoose.Schema({

  server:{
    type: mongoose.Schema.Types.ObjectId,
    ref:"SenderServer",
    required:true,
    unique:true,
    index:true
  },

  queues:[
    {
      domain:String,
      queued:Number
    }
  ],

  updatedAt:{
    type:Date,
    default:Date.now
  }

});

export default mongoose.model("PmtaQueues",schema);