// js/core/mythos-engine.js
// MYTHOS HYBRID ENGINE v5.1
// Handles direct API calls to Google Gemini (REST)

const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

/**
 * Universal API Call handler
 * @param {string} type - 'generate' | 'embed'
 * @param {object} payload - { sys, prompt, model, text }
 * @param {string} apiKey - The raw API key
 */
export async function apiCall(type, payload, apiKey) {
    // 1. Sanitize Key
    if (!apiKey) throw new Error("API Key is missing.");
    const cleanKey = apiKey.trim().replace(/[\r\n]+/g, ''); 

    // 2. Route Selection
    let url, body;
    
    if (type === 'embed') {
        // Embedding Endpoint
        const model = payload.model || "text-embedding-004";
        url = `${BASE_URL}/${model}:embedContent?key=${cleanKey}`;
        body = {
            model: `models/${model}`,
            content: { parts: [{ text: payload.text }] }
        };
    } else {
        // Generation Endpoint
        const model = payload.model || "gemini-2.0-flash-exp";
        url = `${BASE_URL}/${model}:generateContent?key=${cleanKey}`;
        
        const contents = [];
        if (payload.sys) {
            contents.push({ role: "user", parts: [{ text: "SYSTEM INSTRUCTION:\n" + payload.sys }] });
            contents.push({ role: "model", parts: [{ text: "Understood." }] });
        }
        contents.push({ role: "user", parts: [{ text: payload.prompt }] });

        body = {
            contents: contents,
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 2000
            }
        };
    }

    // 3. Execution
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        const data = await response.json();

        // 4. Error Trapping
        if (data.error) {
            console.error("[Mythos Engine] API Error:", data.error);
            throw new Error(data.error.message || "Unknown API Error");
        }

        return data;

    } catch (e) {
        console.error("[Mythos Engine] Network Failure:", e);
        throw e;
    }
}

// Vector Utility (Cosine Similarity)
export const normalize = (v) => {
    const norm = Math.sqrt(v.reduce((sum, val) => sum + val * val, 0));
    return v.map(val => val / norm);
};

export class VectorEngine {
    constructor(vectors) {
        this.memory = vectors || [];
    }
    
    search(queryVec, topK = 5) {
        if(!this.memory.length) return [];
        
        const scored = this.memory.map(mem => {
            if(!mem.embedding) return null;
            const score = this.cosine(queryVec, mem.embedding);
            return { ...mem, score };
        }).filter(x => x);

        return scored.sort((a, b) => b.score - a.score).slice(0, topK);
    }

    cosine(A, B) {
        return A.reduce((sum, a, i) => sum + a * B[i], 0);
    }
}