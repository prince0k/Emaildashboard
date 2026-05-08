import Creative from "../../../models/Creative.js";
import { buildPreview } from "../../../utils/templatePreview.js";

export default async (req, res) => {

  const creative = await Creative.findById(req.query.id);

  if (!creative) {
    return res.status(404).send("Creative not found");
  }

  let html = creative.html;

  /* ===============================
     IMAGE HOST FOR PREVIEW
  =============================== */

  const IMAGE_HOST =
    process.env.PREVIEW_IMAGE_HOST || "https://stewartlucas.com";

  /* replace token */
  html = html.replace(/{{IMAGE_HOST}}/g, IMAGE_HOST);

  /* ===============================
     FIX RELATIVE IMAGE PATHS
  =============================== */

  html = html.replace(
    /src="(?!https?:\/\/|data:)([^"]+)"/gi,
    `src="${IMAGE_HOST}/images/$1"`
  );

  res.setHeader("Content-Type", "text/html");

  res.send(buildPreview(html));
};