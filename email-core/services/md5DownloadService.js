import path from "path";
import fs from "fs/promises";
import axios from "axios";
import Offer from "../models/Offer.js";
import downloadFile from "../utils/downloadFile.js";
import { unzip } from "../utils/unzipFile.js";

const BASE_DIR = "/var/www/email-core-data/md5offeroptout";
const OPTIZMO_TOKEN = "UyLzDBHla6zV5jdJIWsPDw6Jv9tkGBLp";

export async function processOffer(offerId) {
  console.log("➡️ PROCESS OFFER:", offerId);

  const offer = await Offer.findById(offerId);
  if (!offer) {
    return { status: "error", message: "Offer not found" };
  }

  if (!offer.optizmoAccessKey) {
    return {
      status: "error",
      message: "Optizmo access key missing for offer",
    };
  }

  /* ---------- CALL OPTIZMO ---------- */
  const optizmoRes = await axios.post(
    `https://mailer-api.optizmo.net/accesskey/download/${offer.optizmoAccessKey}`,
    null,
    {
      params: {
        token: OPTIZMO_TOKEN,
        format: "md5",
      },
      timeout: 300000,
    }
  );

  if (optizmoRes.data?.result !== "success") {
    return {
      status: "error",
      message: "Optizmo returned error",
    };
  }

  const downloadUrl = optizmoRes.data.download_link;
  if (!downloadUrl) {
    throw new Error("No download link from Optizmo");
  }

  /* ---------- ENSURE DIR ---------- */
  await fs.mkdir(BASE_DIR, { recursive: true });

  /* ---------- SNAPSHOT BEFORE ---------- */
  const beforeFiles = new Set(await fs.readdir(BASE_DIR));

  /* ---------- DOWNLOAD ZIP ---------- */
  const tempZip = path.join(BASE_DIR, `tmp_${offer._id}.zip`);
  console.log("⬇️ DOWNLOADING ZIP:", tempZip);

  await downloadFile(downloadUrl, tempZip);

  /* ---------- UNZIP ---------- */
  console.log("📦 UNZIPPING");
  await unzip(tempZip, BASE_DIR);

  /* ---------- SNAPSHOT AFTER ---------- */
  const afterFiles = await fs.readdir(BASE_DIR);

  // only files created by THIS unzip
  const newFiles = afterFiles.filter(f => !beforeFiles.has(f));

  /* ---------- FIND SUPPRESSION FILE ---------- */
  const suppressionFile = newFiles.find(
    f =>
      f.startsWith("suppression_list--") &&
      f.endsWith(".txt")
  );

  if (!suppressionFile) {
    throw new Error(
      "suppression_list file not found in extracted ZIP"
    );
  }

  /* ---------- RENAME (OVERWRITE SAFE) ---------- */
  const finalPath = path.join(BASE_DIR, offer.md5FileName);

  try {
    await fs.unlink(finalPath);
  } catch (_) {}

  console.log("✏️ RENAMING:", suppressionFile, "→", offer.md5FileName);

  await fs.rename(
    path.join(BASE_DIR, suppressionFile),
    finalPath
  );

  /* ---------- CLEAN ONLY DOMAIN FILE FROM THIS ZIP ---------- */
  for (const f of newFiles) {
    if (
      f.startsWith("domains_list--") &&
      f.endsWith(".txt")
    ) {
      await fs.unlink(path.join(BASE_DIR, f));
    }
  }

  /* ---------- DELETE TEMP ZIP ---------- */
  await fs.unlink(tempZip);

  console.log("✅ MD5 READY:", finalPath);

  return {
    status: "success",
    offerId: offer._id,
    cid: offer.cid,
    file: offer.md5FileName,
    path: BASE_DIR,
  };
}
