import "dotenv/config";
import mongoose from "mongoose";
import connectMongo from "../config/mongo.js";
import Campaign from "../models/Campaign.js";
import OpenLog from "../models/OpenLog.js";
import ClickLog from "../models/ClickLog.js";
import OptoutLog from "../models/OptoutLog.js";
import UnsubLog from "../models/UnsubLog.js";
import ComplaintLog from "../models/ComplaintLog.js";
import User from "../models/User.js";
import SenderServer from "../models/SenderServer.js";

async function main() {
  console.log("Connecting to Mongo...");
  await connectMongo();
  console.log("Connected!");
  console.log("Registered models:", mongoose.modelNames());

  try {
    const query = { isDeleted: { $ne: true } };
    const campaigns = await Campaign.find(query)
      .populate("createdBy", "userId email")
      .populate("sender", "name")
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    console.log(`Found ${campaigns.length} campaigns`);

    const offerIds = campaigns.map((c) => c.runtimeOfferId).filter(Boolean);
    console.log("Offer IDs:", offerIds);

    if (!offerIds.length) {
      console.log("No offer IDs, exiting.");
      process.exit(0);
    }

    const openLogMatch = { offer_id: { $in: offerIds } };
    const dayStringMatch = { offer_id: { $in: offerIds } };

    console.log("Running aggregations...");
    const [openAgg, clickAgg, optoutAgg, unsubAgg, complaintAgg] = await Promise.all([
      OpenLog.aggregate([
        { $match: openLogMatch },
        {
          $group: {
            _id: "$offer_id",
            unique: { $sum: "$unique_open_count" },
            total: { $sum: "$total_open_count" },
            bots: { $sum: "$bot_open_count" },
          }
        }
      ]),
      ClickLog.aggregate([
        { $match: dayStringMatch },
        {
          $group: {
            _id: "$offer_id",
            total: { $sum: 1 },
            emails: { $addToSet: "$email" }
          }
        },
        {
          $project: {
            total: 1,
            unique: {
              $size: {
                $filter: {
                  input: "$emails",
                  as: "e",
                  cond: { $ne: ["$$e", null] }
                }
              }
            }
          }
        }
      ]),
      OptoutLog.aggregate([
        { $match: dayStringMatch },
        {
          $group: {
            _id: "$offer_id",
            count: { $sum: 1 }
          }
        }
      ]),
      UnsubLog.aggregate([
        { $match: dayStringMatch },
        {
          $group: {
            _id: "$offer_id",
            count: { $sum: 1 }
          }
        }
      ]),
      ComplaintLog.aggregate([
        { $match: { offer_id: { $in: offerIds } } },
        {
          $group: {
            _id: "$offer_id",
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    console.log("Aggregations succeeded!");
    console.log("OpenAgg count:", openAgg.length);
    console.log("ClickAgg count:", clickAgg.length);
  } catch (err) {
    console.error("Aggregation failed with error:", err);
  }

  process.exit(0);
}

main();
