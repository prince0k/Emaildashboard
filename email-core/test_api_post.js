import "dotenv/config";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import axios from "axios";
import User from "./models/User.js";

const MONGO_URI = "mongodb://127.0.0.1:27017/emailcore_dev";

async function run() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB!");

    // Find a user
    const user = await User.findOne({ active: true }).lean();
    if (!user) {
      console.error("No active user found!");
      return;
    }
    console.log("Using user:", user.userId, user._id.toString());

    // Close mongoose so it doesn't hang the script
    await mongoose.connection.close();

    // Sign JWT
    const token = jwt.sign(
      { mongoId: user._id.toString() },
      process.env.JWT_SECRET,
      {
        issuer: "email-core",
        expiresIn: "1d",
      }
    );

    const payload = {
      sender: "69ff2c36c495d1e717b49461",
      campaignName: "test_copy_endpoint_1779406492787_v4",
      creativeId: "69ff2ee0c495d1e717b49507",
      offerId: "69ff2ea2c495d1e717b494ad",
      isp: "Yahoo",
      segmentName: "test_campaign_20k",
      routeIds: [],
      testEmails: [],
      subjectIds: [],
      fromIds: [],
      runtimeOfferId: "srv_test_endpoint_1779406502592",
      trackingMode: "from",
      trackingDomain: "",
      scheduledDate: "",
      headerMode: "default",
      customHeaderBlock: "Date: {date}\nFrom: {fromName} <{fromEmail}>\nTo: <{to}>\nReply-To: {replyTo}\nSubject: {subject}\nMessage-ID: {mid}\nMIME-Version: 1.0\nList-Unsubscribe: <{listUnsubUrl}>\nList-Unsubscribe-Post: List-Unsubscribe=One-Click\nContent-Type: multipart/alternative; boundary=\"{boundary}\"\nX-virtual-MTA: {vmta}",
      textEncoding: "base64",
      htmlEncoding: "base64",
      totalSend: 0,
      sendInSeconds: "",
      sendInMinutes: "",
      sendInHours: "",
      seeds: "",
      seedAfter: "",
      seedMode: "round",
      draft: true,
      isDraft: true,
      htmlOverride: "<p>test</p>",
      suppressionConfig: {
        queueDomain: "",
        skipUnsub: false,
        inclusionSegments: [],
        exclusionSegments: []
      }
    };

    console.log("Sending POST request to http://localhost:3001/api/campaigns/create...");
    const res = await axios.post("http://localhost:3001/api/campaigns/create", payload, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    console.log("SUCCESS RESPONSE:", res.status, JSON.stringify(res.data, null, 2));

  } catch (err) {
    if (err.response) {
      console.error("HTTP ERROR RESPONSE STATUS:", err.response.status);
      console.error("HTTP ERROR RESPONSE DATA:", JSON.stringify(err.response.data, null, 2));
    } else {
      console.error("ERROR:", err.message);
    }
  }
}

run();
