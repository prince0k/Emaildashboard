import Campaign from "../models/Campaign.js"
import ClickLog from "../models/ClickLog.js"
import OpenLog from "../models/OpenLog.js"
import UnsubLog from "../models/UnsubLog.js"
import OptoutLog from "../models/OptoutLog.js"
import SenderServer from "../models/SenderServer.js"
function lastNDays(n = 5) {
 const days = []
 const now = new Date()

 for (let i = 0; i < n; i++) {
  const d = new Date(now)
  d.setDate(d.getDate() - i)

  days.push(
   d.toLocaleDateString("en-CA", {
    timeZone: "America/Los_Angeles"
   })
  )
 }

 return days
}

export async function getSenderDailyStats(options = {}) {

 const days = lastNDays(options.days || 5)

 /* ========================
   DELIVERED
======================== */

const delivered = await Campaign.aggregate([
{
 $addFields:{
  vmta:{
   $arrayElemAt:[
    { $split:["$runtimeOfferId","_"] },
    0
   ]
  },
  day:{
   $dateToString:{
    format:"%Y-%m-%d",
    date:"$createdAt"
   }
  }
 }
},
{
 $match:{
  day:{ $in: days }
 }
},
{
 $group:{
  _id:{
   day:"$day",
   sender:"$vmta"
  },
  delivered:{
   $sum:"$execution.delivered"
  }
 }
}
])

 /* ========================
    CLICKS
 ======================== */

 const clicks = await ClickLog.aggregate([
 {
  $match:{ day:{ $in:days } }
 },
 {
  $group:{
   _id:{
    day:"$day",
    sender:{
     $concat:[
 { $ifNull:["$vmta",""] },
 "|",
 { $ifNull:["$send_domain",""] }
]
    }
   },
   clicks:{ $sum:1 }
  }
 }
 ])

 /* ========================
    OPENS
 ======================== */

const opens = await OpenLog.aggregate([
{
 $project:{
  vmta:1,
  send_domain:1,
  total_open_count:1,
  dayStr:{
   $dateToString:{
    format:"%Y-%m-%d",
    date:"$day"
   }
  }
 }
},
{
 $match:{
  dayStr:{ $in: days }
 }
},
{
 $group:{
  _id:{
   day:"$dayStr",
   sender:{
    $concat:["$vmta","|","$send_domain"]
   }
  },
  opens:{ $sum:"$total_open_count" }
 }
}
])

  /* =========================
     UNSUB
  ========================= */

  const unsubs = await UnsubLog.aggregate([
    { $match: { day: { $in: days } } },
    {
      $group: {
        _id: {
          day: "$day",
          sender: { $concat: ["$vmta", "|", "$send_domain"] },
        },
        unsub: { $sum: 1 },
      },
    },
  ]);

  /* =========================
     OPTOUT
  ========================= */

  const optouts = await OptoutLog.aggregate([
    { $match: { day: { $in: days } } },
    {
      $group: {
        _id: {
          day: "$day",
          sender: { $concat: ["$vmta", "|", "$send_domain"] },
        },
        optout: { $sum: 1 },
      },
    },
  ]);

  /* ========================
    MERGE
 ======================== */
  const senderServers = await SenderServer.find().lean()

const routeMap = {}

senderServers.forEach(server => {

  if (!Array.isArray(server.routes)) return

  server.routes.forEach(route => {

    const key = route.vmta + "|" + route.domain

    routeMap[key] = server.name.toLowerCase()

  })

})
 const map = {}

 function apply(rows, field){

 rows.forEach(r => {

  const sender = r._id?.sender
  const day = r._id?.day

  if (!sender || !day) return

  let senderKey = sender

  if (typeof sender === "string" && sender.includes("|")) {
  senderKey = routeMap[sender] || sender
  }

  senderKey = senderKey.toLowerCase()

  const key = day + "|" + senderKey

  if(!map[key]){

   map[key] = {
    day,
    sender: senderKey,
    delivered:0,
    clicks:0,
    opens:0,
    unsub:0,
    optout:0
   }

  }

  map[key][field] = r[field] || 0

 })
}
apply(delivered,"delivered")
apply(clicks,"clicks")
apply(opens,"opens")
apply(unsubs,"unsub")
apply(optouts,"optout")

 return Object.values(map).sort((a,b)=> new Date(b.day) - new Date(a.day))

}