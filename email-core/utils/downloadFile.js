import fs from "fs";
import axios from "axios";

export default async function downloadFile(url, dest) {
  const writer = fs.createWriteStream(dest);

  try {
    const response = await axios({
      method: "get",
      url,
      responseType: "stream",
      timeout: 300000, // 5 min
    });

    await new Promise((resolve, reject) => {
      response.data.pipe(writer);

      writer.on("finish", resolve);
      writer.on("error", reject);
    });

    return true;
  } catch (err) {
    console.error("❌ DOWNLOAD FAILED:", err.message);
    throw err;
  }
}