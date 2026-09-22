import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { prompt, context } = req.body || {};

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: 'GEMINI_API_KEY not configured on Vercel' });
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Context: ${context || ''}\n\nUser request: ${prompt || ''}`,
      config: {
        systemInstruction: "You are the Lore Oracle for the Mythos Lorepack Factory. You specialize in crafting atmospheric, myth-driven storytelling assets. Your tone is grand, slightly cynical, and deeply imaginative. Output in markdown.",
      },
    });

    return res.status(200).json({ text: response.text });
  } catch (error: any) {
    console.error('Vercel Gemini error:', error);
    return res.status(500).json({ error: error.message || 'Failed to generate lore' });
  }
}
