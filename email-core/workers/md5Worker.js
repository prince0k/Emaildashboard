import { processOffer } from "../services/md5DownloadService.js";

process.on("message", async (data) => {
  const { offerId } = data;

  try {
    await processOffer(offerId);
    process.send({ status: "done", offerId });
  } catch (err) {
    process.send({ status: "failed", offerId });
  }
});