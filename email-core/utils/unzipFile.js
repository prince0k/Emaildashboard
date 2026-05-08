import unzipper from "unzipper";
import fs from "fs";

export async function unzip(zipPath, extractPath) {
  return fs
    .createReadStream(zipPath)
    .pipe(unzipper.Extract({ path: extractPath }))
    .promise();
}
