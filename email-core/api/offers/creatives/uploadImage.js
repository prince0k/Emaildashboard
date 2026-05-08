import fs from "fs/promises"
import path from "path"
import multer from "multer"

import auth from "../../../middleware/auth.js"
import checkPermission from "../../../middleware/checkPermission.js"
import { PATHS } from "../../../config/paths.js"

import { deployImageToSenders } from "../../../services/senderImageDeploy.js"

/* ================================
   MULTER CONFIG
================================ */

const storage = multer.memoryStorage()

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB per file
  }
})

/* ================================
   HANDLER
================================ */

const handler = async (req, res) => {
  try {

    /* ================================
       VALIDATION
    ================================= */

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "no_files_uploaded" })
    }

    const offerId = req.body.offerId

    if (!offerId) {
      return res.status(400).json({ error: "offerId_required" })
    }

    /* ================================
       CREATE DIRECTORY
    ================================= */

    const dir = path.join(PATHS.creativeAssets, `offer_${offerId}`)
    await fs.mkdir(dir, { recursive: true })

    const baseUrl = process.env.PUBLIC_ASSET_URL || "https://blastbees.com"

    const allowed = [".jpg",".jpeg",".png",".gif",".webp"]

    const uploadedFiles = []
    const skippedFiles = []

    /* ================================
       PROCESS ALL FILES
    ================================= */

    for (const file of req.files) {

      try {

        const ext = path.extname(file.originalname).toLowerCase()

        if (!allowed.includes(ext)) {
          skippedFiles.push({
            name: file.originalname,
            reason: "invalid_type"
          })
          continue
        }

        /* ================================
           SAFE FILE NAME
        ================================= */

        let safeName = path.basename(file.originalname)

        safeName = safeName.replace(/[^a-zA-Z0-9._-]/g, "_")

        let fullPath = path.join(dir, safeName)

        try {
          await fs.access(fullPath)
          safeName = Date.now() + "_" + safeName
        } catch {}

        const filePath = path.join(dir, safeName)

        /* ================================
           SAVE FILE
        ================================= */

        await fs.writeFile(filePath, file.buffer)

        /* ================================
           DEPLOY (ASYNC)
        ================================= */

        deployImageToSenders(filePath)
          .catch(err => console.error("DEPLOY FAILED:", err))

        /* ================================
           URL BUILD
        ================================= */

        const url = `${baseUrl}/creative_assets/offer_${offerId}/${safeName}`

        uploadedFiles.push({
          file: safeName,
          url
        })

      } catch (fileErr) {

        console.error("FILE PROCESS ERROR:", file.originalname, fileErr)

        skippedFiles.push({
          name: file.originalname,
          reason: "processing_failed"
        })

      }
    }

    /* ================================
       RESPONSE
    ================================= */

    return res.json({
      success: true,
      total: req.files.length,
      uploaded: uploadedFiles.length,
      skipped: skippedFiles.length,
      files: uploadedFiles,
      errors: skippedFiles
    })

  } catch (err) {

    console.error("IMAGE UPLOAD ERROR:", err)

    return res.status(500).json({
      error: "upload_failed",
      message: err.message
    })

  }
}

/* ================================
   EXPORT ROUTE
================================ */

export default [
  auth,
  checkPermission("creative.create"),
  upload.array("images", 50), // 🔥 bulk upload enabled
  handler
]