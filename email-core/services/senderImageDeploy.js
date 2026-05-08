import axios from "axios"
import FormData from "form-data"
import fs from "fs"
import path from "path"
import SenderServer from "../models/SenderServer.js"

const INTERNAL_KEY = process.env.SENDER_INTERNAL_KEY

const MAX_RETRIES = 2
const CONCURRENCY = 5 // 🔥 limit parallel uploads

/* =================================
   HELPER: RETRY LOGIC
================================= */

async function uploadWithRetry(sender, filePath, fileName) {

  const uploadUrl = `${sender.baseUrl}/uploadImage.php`

  for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt++) {

    try {

      const form = new FormData()
      form.append("image", fs.createReadStream(filePath), fileName)

      const res = await axios.post(uploadUrl, form, {
        headers: {
          ...form.getHeaders(),
          "X-Internal-Key": INTERNAL_KEY
        },
        timeout: 30000 // 🔥 safer
      })

      // 🔥 basic validation
      if (res.status !== 200) {
        throw new Error(`Invalid status ${res.status}`)
      }

      console.log(`✅ ${sender.name} (attempt ${attempt})`)
      return true

    } catch (err) {

      console.warn(
        `⚠️ ${sender.name} failed (attempt ${attempt})`,
        err.response?.data || err.message
      )

      if (attempt > MAX_RETRIES) {
        console.error(`❌ FINAL FAIL: ${sender.name}`)
        return false
      }
    }
  }
}

/* =================================
   MAIN FUNCTION
================================= */

export async function deployImageToSenders(filePath) {

  if (!fs.existsSync(filePath)) {
    console.error("❌ File does not exist:", filePath)
    return
  }

  const fileName = path.basename(filePath)

  const senders = await SenderServer
    .find({ active: true })
    .select("baseUrl name")

  if (!senders.length) {
    console.warn("⚠️ No active sender servers found")
    return
  }

  console.log(`🚀 Deploying ${fileName} to ${senders.length} servers`)

  /* =================================
     CONCURRENCY CONTROL
  ================================= */

  const queue = [...senders]
  const workers = []

  for (let i = 0; i < CONCURRENCY; i++) {

    const worker = (async () => {

      while (queue.length) {

        const sender = queue.shift()
        if (!sender) break

        await uploadWithRetry(sender, filePath, fileName)

      }

    })()

    workers.push(worker)
  }

  await Promise.all(workers)

  console.log(`✅ Deployment finished: ${fileName}`)

  return fileName
}