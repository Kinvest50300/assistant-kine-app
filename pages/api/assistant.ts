import type { NextApiRequest, NextApiResponse } from "next";
import { google } from "googleapis";
import { GoogleAuth } from "google-auth-library";
import OpenAI from "openai";

const SHEET_ID = process.env.GOOGLE_SHEET_ID!;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;
const serviceAccount = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY!);

const auth = new GoogleAuth({
  credentials: serviceAccount,
  scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
});

const sheets = google.sheets("v4");

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const client = await auth.getClient();
    const sheetRes = await sheets.spreadsheets.values.get({
      auth: client,
      spreadsheetId: SHEET_ID,
      range: "Feuille1!A2:B2",
    });

    const values = sheetRes.data.values?.[0] || [];
    const exercice = values[0] || "Exercice non défini";
    const recommandation = values[1] || "";

    const { message } = req.body;

    const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `Tu es un assistant kiné. Tu tutoies le patient. Réponds de manière claire, concise, bienveillante et professionnelle. Si le message concerne l'exercice du jour : "${exercice}" ou la recommandation : "${recommandation}", tu peux t'y référer.`,
        },
        {
          role: "user",
          content: message,
        },
      ],
    });

    const botReply = completion.choices[0].message?.content;

    res.status(200).json({ reply: botReply });
  } catch (error) {
    console.error("Erreur API assistant:", error);
    res.status(500).json({ error: "Erreur interne du serveur." });
  }
}
