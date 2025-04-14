
import { google } from 'googleapis';
import { NextApiRequest, NextApiResponse } from 'next';
import { OpenAI } from 'openai';

const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const SERVICE_ACCOUNT_KEY = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY || '{}');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const auth = new google.auth.GoogleAuth({
  credentials: SERVICE_ACCOUNT_KEY,
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { type, prenom, message } = req.body;

  if (!prenom) return res.status(400).json({ error: 'Prénom requis' });

  try {
    const authClient = await auth.getClient();
google.options({ auth: authClient });
const sheets = google.sheets({ version: 'v4' });
    const result = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Feuille1!A2:E',
    });

    const rows = result.data.values || [];
    const patient = rows.find(row => row[1]?.toLowerCase() === prenom.toLowerCase());

    if (!patient) return res.status(404).json({ error: 'Patient non trouvé' });

    const [id, nom, email, exercice_du_jour, remarques] = patient;

    if (type === 'fetch-data') {
      return res.status(200).json({ exercice_du_jour, remarques });
    }

    if (type === 'chat') {
      const prompt = `Tu es un assistant kiné bienveillant. Le prénom du patient est ${prenom}.
      Son exercice du jour est : ${exercice_du_jour}.
      Recommandations : ${remarques}.
      Question : ${message}
      Réponds de manière courte, naturelle, en le tutoyant.`;

      const completion = await openai.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'gpt-3.5-turbo',
      });

      return res.status(200).json({ reply: completion.choices[0].message.content });
    }

    res.status(400).json({ error: 'Type de requête inconnu' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}
