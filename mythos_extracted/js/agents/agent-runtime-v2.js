// js/agents/agent-runtime-v2.js
// RUNTIME V2: Links to core-v2.js

import { apiCall, normalize, VectorEngine } from '../core/core-v2.js';
import { NumMarkX } from '../memory/numark-x.js'; 

// Soft import for ingestion to prevent crashes if file missing
let ingestLoreText = null;
try {
    const m = await import('../ingestion/lorepack.js');
    ingestLoreText = m.ingestLoreText;
} catch(e) { console.warn("Auto-ingest disabled (lorepack.js missing)"); }

export class AgentRuntime {
  constructor({ agentMeta, db }) {
    this.id = agentMeta.id;
    this.handle = agentMeta.handle || agentMeta.id;
    this.agentMeta = agentMeta;
    this.db = db;
    this.model = agentMeta.default_model || 'gemini-2.0-flash-exp';
    this.autoIngest = agentMeta.auto_ingest === true; 
  }

  // --- RECALL ---
  async recall(query) {
    // 1. Jump Drive
    if (NumMarkX && NumMarkX.teleport) {
        const jumpHit = NumMarkX.teleport(query);
        if (jumpHit && jumpHit.agentId === this.id) return [jumpHit];
    }

    // 2. Vector Search
    try {
        const key = localStorage.getItem('mythos_api_key');
        if(!key) return []; // No key, no recall
        
        await this.db.ready;
        const all = await this.db.getAll('vectors');
        const mine = all.filter(v => v.agentId === this.id);
        
        if (mine.length === 0) return [];

        const embedData = await apiCall('embed', { text: query }, key);
        const qVec = normalize(embedData.embedding.values);
        return VectorEngine.search(qVec, mine, 5);
    } catch (e) {
        console.warn(`[${this.id}] Recall error:`, e);
        return []; // Fail gracefully so we can still chat
    }
  }

  // --- RESPOND ---
  async respond({ message, from, context = '', focus = null, transcript = [] }) {
    // A. Gather Context
    const memories = await this.recall(message);
    const memText = memories.map(n => `[MEMORY]: ${n.text}`).join('\n');
    const sys = this.agentMeta.system_instruction || `You are ${this.handle}.`;

    // B. Build Prompt
    const prompt = `
ROOM FOCUS: ${focus || 'Open'}
---
RELEVANT MEMORY:
${memText || "No records found."}
---
RECENT TRANSCRIPT:
${transcript.map(t => `${t.from}: ${t.text}`).slice(-5).join('\n')}
---
USER (${from}): ${message}
`.trim();

    // C. Generate
    const apiKey = localStorage.getItem('mythos_api_key');
    if (!apiKey) return "[SYSTEM: API KEY REQUIRED]";

    try {
        const data = await apiCall('generate', {
            sys: sys,
            prompt: prompt,
            model: this.model
        }, apiKey);

        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || '...';

        // D. Auto-Ingest
        if (this.autoIngest && ingestLoreText) {
            ingestLoreText({
                agentId: this.id,
                text: `[User]: ${message}\n[Me]: ${reply}`,
                source: 'chat_session',
                apiKey: apiKey
            }).catch(e => {});
        }

        return reply;
    } catch (e) {
        return `[ERROR: ${e.message}]`;
    }
  }
}