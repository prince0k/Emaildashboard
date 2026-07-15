import fs from "fs";
import axios from "axios";

export default async function downloadFile(url, dest) {
  const writer = fs.createWriteStream(dest);

  try {
    const response = await axios({
      method: "get",
      url,
      responseType: "stream",
      timeout: 1800000, // 30 minutes (handles large files / slow speeds)
    });

    const contentLength = parseInt(response.headers["content-length"], 10);
    let bytesDownloaded = 0;

    response.data.on("data", (chunk) => {
      bytesDownloaded += chunk.length;
    });

    await new Promise((resolve, reject) => {
      response.data.pipe(writer);

      writer.on("finish", () => {
        if (!isNaN(contentLength) && bytesDownloaded < contentLength) {
          reject(new Error(`Download truncated: received ${bytesDownloaded} of ${contentLength} bytes`));
        } else {
          resolve();
        }
      });
      writer.on("error", reject);
    });

    return true;
  } catch (err) {
    console.error("❌ DOWNLOAD FAILED:", err.message);
    throw err;
  }
}