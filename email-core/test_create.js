import mongoose from "mongoose";
import Campaign from "./models/Campaign.js";

const MONGO_URI = "mongodb://127.0.0.1:27017/emailcore_dev";

async function run() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB!");

    const userMongoId = new mongoose.Types.ObjectId("69ff77b830988ecb486531c9");

    const updatePayload = {
      campaignName: "test_copy_campaign_" + Date.now(),
      sender: new mongoose.Types.ObjectId("69ff2c36c495d1e717b49461"),
      creativeId: new mongoose.Types.ObjectId("69ff2ee0c495d1e717b49507"),
      offerId: new mongoose.Types.ObjectId("69ff2ea2c495d1e717b494ad"),
      runtimeOfferId: "srv_123_456_test_copy_" + Date.now(),
      isp: "yahoo",
      segmentName: "test_campaign_20k",
      scheduledAt: null,
      trackingMode: "from",
      trackingDomain: null,
      status: "DRAFT",
      openTriggerCampaignId: null,
      htmlOverride: "<p>test</p>",
      routes: [
        {
          from_user: "mailer",
          domain: "mailovos.com",
          vmta: "54.38.52.119"
        }
      ],
      sendConfig: {
        subjectIds: ["69ff2f02c495d1e717b49558"],
        fromIds: ["69ff2f20c495d1e717b495a9"],
        headerBlockMode: "default",
        customHeaderBlock: "Date: {date}",
        textEncoding: "base64",
        htmlEncoding: "base64",
        createdBy: userMongoId,
        mode: "LIVE",
        totalSend: 20000,
        sendInSeconds: 0,
        sendInMinutes: 1,
        sendInHours: 0,
        seeds: ["prince4sharmaa123@gmail.com"],
        seedAfter: 200,
        seedMode: "round",
      },
      suppressionConfig: {
        queueDomain: null,
        skipUnsub: false,
        inclusionSegments: [],
        exclusionSegments: []
      },
      environment: "production",
      createdAt: new Date(),
      createdBy: userMongoId
    };

    const campaign = await Campaign.create(updatePayload);
    console.log("Created successfully!", campaign._id);

    await mongoose.connection.close();
  } catch (err) {
    console.error("Mongoose Error:", err);
  }
}

run();
