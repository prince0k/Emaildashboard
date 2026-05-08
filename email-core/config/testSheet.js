import { google } from "googleapis";

const auth = new google.auth.GoogleAuth({
  keyFile: "./google-service.json", // path check kar lena
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });

async function test() {
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: "1v_QtGn8DKnYGoQVrGFDCFZ5JHZOpOppi40E9uZhJ1EI",
      range: "Sheet12!A1:B5", // agar sheet name alag hai toh change kar
    });

    console.log("✅ SUCCESS:");
    console.log(res.data.values);

  } catch (err) {
    console.error("❌ ERROR:");
    console.error(err.message);
  }
}

test();