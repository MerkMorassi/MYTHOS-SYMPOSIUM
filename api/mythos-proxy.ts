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
  // Enable CORS for Vercel preview environments
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { endpoint, payload } = req.body || {};

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ 
      error: 'GEMINI_API_KEY environment variable is not configured in Vercel project settings.' 
    });
  }

  try {
    if (endpoint === 'embed') {
      const result = await ai.models.embedContent({
        model: payload?.model || "text-embedding-004",
        contents: payload?.text || "",
      });
      const embedding = (result as any).embedding || (result as any).embeddings?.[0];
      return res.status(200).json({ embedding });
    } else if (endpoint === 'generate') {
      const result = await ai.models.generateContent({
        model: payload?.model || 'gemini-2.5-flash',
        contents: payload?.prompt || "",
        config: (payload?.sys || payload?.systemInstruction) ? {
          systemInstruction: payload.sys || payload.systemInstruction
        } : undefined
      });
      return res.status(200).json({ text: result.text });
    }

    return res.status(400).json({ error: 'Invalid endpoint: must be embed or generate' });
  } catch (error: any) {
    console.error('Vercel API mythos-proxy error:', error);
    return res.status(500).json({ error: error.message || 'Failed to process Mythos API call' });
  }
}
