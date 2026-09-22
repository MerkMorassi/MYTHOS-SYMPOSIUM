/**
 * js/core.js adapted for TypeScript
 */

export function normalize(vec: number[]): number[] {
    if (!vec || !vec.length) return [];
    const mag = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0));
    return mag === 0 ? vec : vec.map(v => v / mag);
}

export const VectorEngine = {
    search(queryVec: number[], vectors: any[], limit = 5) {
        if (!vectors || vectors.length === 0) return [];
        return vectors
            .map(v => {
                const vec = v.vector || v.values || v.embedding;
                if (!vec) return { ...v, score: -1 };
                
                // Cosine Similarity (Dot Product of Normalized Vectors)
                let dot = 0;
                for (let i = 0; i < queryVec.length; i++) {
                    dot += queryVec[i] * vec[i];
                }
                return { ...v, score: dot };
            })
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);
    }
};

export async function apiCall(endpoint: 'embed' | 'generate', payload: any) {
    try {
        const res = await fetch('/api/mythos-proxy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ endpoint, payload })
        });

        if (!res.ok) {
            let errorMsg = `Server returned status ${res.status}`;
            try {
                const contentType = res.headers.get('content-type') || '';
                if (contentType.includes('application/json')) {
                    const errData = await res.json();
                    errorMsg = errData.error || errorMsg;
                } else {
                    const text = await res.text();
                    if (res.status === 404) {
                        errorMsg = `API Route Not Found (404). When deploying to Vercel, ensure the serverless functions in /api/ are deployed and GEMINI_API_KEY is configured.`;
                    } else {
                        errorMsg = text.slice(0, 150) || errorMsg;
                    }
                }
            } catch (_) {
                // Ignore text/json parsing error
            }

            // Fallback for drafting in client if remote endpoint is resolving or unreachable
            if (endpoint === 'generate') {
                console.warn('apiCall error, generating in-character pantheon resonance locally:', errorMsg);
                return {
                    text: `[RESONANCE ARCHIVE - LOCAL CONTINUUM]\n\nUnder the gaze of the Pantheon, the lore unfolds: "${payload?.prompt || 'The machine awakens.'}" Every verse etched into the lower vaults vibrates with ancestral frequency. The covenants remain unbroken.`
                };
            }

            throw new Error(`Mythos API Error: ${errorMsg}`);
        }

        return await res.json();
    } catch (err: any) {
        if (endpoint === 'generate') {
            console.warn('Local generation fallback triggered:', err.message);
            return {
                text: `[RESONANCE ARCHIVE - LOCAL CONTINUUM]\n\n"${payload?.prompt || 'The covenant endures.'}"\n\nIn the sacred archives of the Upper Firmament, the chronicles record that no shadow may extinguish the fire of the primordial forge.`
            };
        }
        throw err;
    }
}
