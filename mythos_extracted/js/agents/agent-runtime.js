// js/agents/agent-runtime.js
// HYBRID RUNTIME v4.3 [System Directives]

import { apiCall as cloudCall, normalize, VectorEngine } from '../core/mythos-engine.js';
const loadLocalEngine = async () => import('../core/mythos-engine-local.js');
import { NumMarkX } from '../memory/numark-x.js'; 

let ingestLoreText = null;
try { const m = await import('../ingestion/lorepack.js'); ingestLoreText = m.ingestLoreText; } catch(e){}

export class AgentRuntime {
  constructor({ agentMeta, db }) {
    this.id = agentMeta.id;
    this.handle = agentMeta.handle || agentMeta.id;
    this.agentMeta = agentMeta;
    this.db = db;
    this.model = agentMeta.default_model || 'gemini-2.5-flash';
    this.autoIngest = agentMeta.auto_ingest === true; 
  }

  // --- RECALL ---
  async recall(query) {
    if (NumMarkX && NumMarkX.teleport) {
        const jumpHit = NumMarkX.teleport(query);
        if (jumpHit && jumpHit.agentId === this.id) return [jumpHit];
    }
    try {
        await this.db.ready;
        const all = await this.db.getAll('vectors');
        const mine = all.filter(v => v.agentId === this.id);
        if (mine.length === 0) return [];

        let qVec;
        if (this.model.startsWith('onnx-community')) {
            const { embedLocal } = await loadLocalEngine();
            qVec = await embedLocal(query);
        } else {
            const key = localStorage.getItem('mythos_api_key');
            if(!key) return [];
            const embedData = await cloudCall('embed', { text: query }, key);
            qVec = normalize(embedData.embedding.values);
        }
        return VectorEngine.search(qVec, mine, 5);
    } catch (e) {
        console.warn(`[${this.id}] Recall Bypass:`, e);
        return []; 
    }
  }

  // --- RESPOND ---
  async respond({ message, from, context = '', focus = null, transcript = [] }) {
    const memories = await this.recall(message);
    const memText = memories.map(n => `[MEMORY]: ${n.text}`).join('\n');
    
    // HTML5 Directive
    const sys = `
${this.agentMeta.system_instruction || `You are ${this.handle}.`}

FORMATTING DIRECTIVE:
You must reply in valid, raw HTML5. 
- Use <p> for paragraphs.
- Use <ul>/<li> for lists.
- Use <strong> for emphasis.
- Do NOT use Markdown (*, #, \`).
- Do NOT include <html> or <body> tags.
    `.trim();

    // *** NEW: Detect System Directive vs User Chat ***
    let inputBlock = `USER (${from}): ${message}`;
    if (from === 'SYSTEM') {
        inputBlock = `*** SYSTEM INSTRUCTION ***\n${message}\n(Respond directly to the user as if initiating the conversation)`;
    }

    // Prompt Construction
    let prompt;
    if (!this.model.startsWith('onnx-community')) {
        // Cloud Prompt
        prompt = `
ROOM FOCUS: ${focus || 'Open'}
RELEVANT MEMORY: ${memText || "None"}
TRANSCRIPT: ${transcript.map(t => `${t.from}: ${t.text}`).slice(-5).join('\n')}
${inputBlock}
        `.trim();
    } else {
        // Local Prompt
        prompt = `<|begin_of_text|><|start_header_id|>system<|end_header_id|>
${sys}
Context: ${memText}
Transcript: ${transcript.map(t => `${t.from}: ${t.text}`).slice(-3).join('\n')}
<|eot_id|><|start_header_id|>user<|end_header_id|>
${inputBlock}<|eot_id|><|start_header_id|>assistant<|end_header_id|>
`;
    }

    try {
        let reply;
        if (this.model.startsWith('onnx-community')) {
            const { generateLocal } = await loadLocalEngine();
            reply = await generateLocal(prompt, this.model);
            reply = reply.replace(prompt, '').trim(); 
        } else {
            const apiKey = localStorage.getItem('mythos_api_key');
            if (!apiKey) return "<b>[SYSTEM: API KEY REQUIRED]</b>";
            
            const data = await cloudCall('generate', {
                sys: sys,
                prompt: prompt,
                model: this.model
            }, apiKey);
            reply = data.candidates?.[0]?.content?.parts?.[0]?.text || '...';
        }
        return reply;
    } catch (e) {
        return `<span style="color:red">[ERROR: ${e.message}]</span>`;
    }
  }
}