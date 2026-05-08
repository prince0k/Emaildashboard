import mongoose from "mongoose";

const SenderDailyStatsSchema = new mongoose.Schema({

 day:{
  type:String,
  index:true
 },

 runtimeOfferId:{
  type:String,
  index:true
 },

 campaignId:{
  type: mongoose.Schema.Types.ObjectId,
  ref:"Campaign",
  index:true
 },

 offerId:{
  type: mongoose.Schema.Types.ObjectId,
  ref:"Offer",
  index:true
 },

 vmta:{
  type:String,
  index:true
 },

 send_domain:{
  type:String,
  index:true
 },

 senderServer:{
  type:String,
  index:true
 },

 senderKey:{
  type:String,
  index:true
 },

 delivered:{
  type:Number,
  default:0
 },

 opens:{
  type:Number,
  default:0
 },

 clicks:{
  type:Number,
  default:0
 },

 unsub:{
  type:Number,
  default:0
 },

 optout:{
  type:Number,
  default:0
 },

 hardBounce:{
  type:Number,
  default:0
 },

 softBounce:{
  type:Number,
  default:0
 }

},{timestamps:true})

SenderDailyStatsSchema.index({
 day:1,
 vmta:1,
 domain:1,
 runtimeOfferId:1
},{unique:true})

export default mongoose.models.SenderDailyStats ||
mongoose.model("SenderDailyStats",SenderDailyStatsSchema)