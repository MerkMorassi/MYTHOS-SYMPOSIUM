import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

async function createServer() {
  const app = express();
  const port = process.env.PORT || 3000;

  app.use(express.json());

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', domain: 'Mythos Lorepack Factory' });
  });

  // Mythos Proxy for Gemini calls
  app.post('/api/mythos-proxy', async (req, res) => {
    const { endpoint, payload } = req.body;
    
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    try {
      if (endpoint === 'embed') {
        const result = await ai.models.embedContent({
          model: payload.model || "text-embedding-004",
          contents: payload.text,
        });
        const embedding = (result as any).embedding || (result as any).embeddings?.[0];
        return res.json({ embedding });
      } else if (endpoint === 'generate') {
        const result = await ai.models.generateContent({
          model: payload.model || 'gemini-2.5-flash',
          contents: payload.prompt,
          config: (payload.sys || payload.systemInstruction) ? {
            systemInstruction: payload.sys || payload.systemInstruction
          } : undefined
        });
        return res.json({ text: result.text });
      }
      res.status(400).json({ error: 'Invalid endpoint' });
    } catch (error: any) {
      console.error('Mythos Proxy error:', error);
      res.status(500).json({ error: error.message || 'Failed to proxy mythos call' });
    }
  });

  // Gemini endpoint for Lore Generation (Legacy/Alternative)
  app.post('/api/generate-lore', async (req, res) => {
    const { prompt, context } = req.body;
    
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: `Context: ${context}\n\nUser request: ${prompt}`,
        config: {
          systemInstruction: "You are the Lore Oracle for the Mythos Lorepack Factory. You specialize in crafting atmospheric, myth-driven storytelling assets. Your tone is grand, slightly cynical, and deeply imaginative. Output in markdown.",
        },
      });

      res.json({ text: response.text });
    } catch (error) {
      console.error('Gemini error:', error);
      res.status(500).json({ error: 'Failed to generate lore' });
    }
  });

  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
    });
    app.use(vite.middlewares);
    app.get('*', async (req, res, next) => {
      const url = req.originalUrl;
      try {
        let template = await vite.transformIndexHtml(url, `
          <!doctype html>
          <html lang="en">
            <head>
              <meta charset="UTF-8" />
              <meta name="viewport" content="width=device-width, initial-scale=1.0" />
              <title>Mythos Lorepack Factory</title>
              <meta name="description" content="Collaborative symposium hall for crafting storytelling assets." />
            </head>
            <body>
              <div id="root"></div>
              <script type="module" src="/src/main.tsx"></script>
            </body>
          </html>
        `);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  }

  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
}

createServer();
