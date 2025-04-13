import type { NextApiRequest, NextApiResponse } from "next";
import { Configuration, OpenAIApi } from "openai";

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  const { message } = req.body;

  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "Message invalide" });
  }

  try {
    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "Tu es un assistant kiné bienveillant. Réponds toujours de façon courte, claire et encourageante.",
        },
        {
          role: "user",
          content: message,
        },
      ],
    });

    const reply = completion.data.choices[0]?.message?.content?.trim() || "";
    return res.status(200).json({ reply });
  } catch (error) {
    console.error("Erreur API OpenAI:", error);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}
