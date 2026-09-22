/**
 * js/memory/numark-x.js adapted for TypeScript
 */

export const NumMarkX = {
    index: new Map<string, any>(),

    encode(text: string) {
        return (text || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    },

    initialize(vectors: any[]) {
        this.index.clear();
        vectors.forEach(v => {
            if (!v.text) return;
            const key = this.encode(v.text.substring(0, 50));
            if (key.length > 5) this.index.set(key, v);
        });
    },

    teleport(query: string) {
        if (!query) return null;
        const key = this.encode(query);
        
        if (this.index.has(key)) return this.index.get(key);
        
        if (key.length > 8) {
            for (const [k, v] of this.index) {
                if (k.startsWith(key)) return v;
            }
        }
        
        return null;
    }
};
