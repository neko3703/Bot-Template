import { google } from "googleapis";

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  },
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });
const SPREADSHEET_ID = process.env.DB_ID;

export async function setCustomGoodbyeMessage(guildId, message) {
  const data = await getSheetData();

  const rowIndex = data.findIndex((row) => row[0] === guildId);

  if (rowIndex !== -1) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `Goodbye!A:B${rowIndex + 1}`, // Name your sheet Goodbye
      valueInputOption: "RAW",
      requestBody: {
        values: [[message]],
      },
    });
  } else {
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: "Goodbye!A:B",
      valueInputOption: "RAW",
      requestBody: {
        values: [[guildId, message]],
      },
    });
  }
}

export async function getCustomGoodbyeMessage(guildId) {
  const data = await getSheetData();
  const row = data.find((r) => r[0] === guildId);
  return row?.[1] || null;
}

async function getSheetData() {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "Goodbye!A:B",
  });
  return res.data.values || [];
}
