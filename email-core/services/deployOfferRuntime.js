import axios from "axios";

const DEPLOY_URL = process.env.DEPLOY_SERVER_URL;
const INTERNAL_KEY = process.env.SEND_SERVER_KEY;

export default async function deployOfferRuntime({ sid, runtimeOfferId }) {
  await axios.post(
    DEPLOY_URL,
    {
      sid,
      offer_id: runtimeOfferId,
    },
    {
      headers: {
        "X-Internal-Key": INTERNAL_KEY,
      },
      timeout: 5000,
    }
  );
}
