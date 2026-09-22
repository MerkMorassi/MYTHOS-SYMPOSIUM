// js/ingestion/ingestion.js
// MYTHOS FORGE: RAW DATA -> VECTOR ARTIFACT
// v5.1 [FIXED: Infinite Loop Patch]

// 1. UUID Generator
export function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// 2. The Chunker
// Breaks scripts into semantic blocks with robust loop safety.
export function chunkText(text, chunkSize = 800, overlap = 200) {
    const chunks = [];
    let start = 0;
    
    // Normalize line endings
    const cleanText = text.replace(/\r\n/g, '\n');

    // Safety check for empty files
    if (!cleanText || cleanText.length === 0) return [];

    while (start < cleanText.length) {
        const end = Math.min(start + chunkSize, cleanText.length);
        let chunk = cleanText.slice(start, end);
        
        // Smart Break: Try to break at a double newline (Scene break)
        // rather than mid-sentence.
        const lastSceneBreak = chunk.lastIndexOf('\n\n');
        let actualEnd = end;

        // Only snap back if the break isn't too far back (loss of progress)
        if (lastSceneBreak > chunkSize * 0.5) {
             actualEnd = start + lastSceneBreak + 2; 
             chunk = cleanText.slice(start, actualEnd);
        }

        const trimmed = chunk.trim();
        if (trimmed.length > 0) {
            chunks.push(trimmed);
        }
        
        // CRITICAL FIX: Loop Progression
        // If we reached the end of the text, break immediately.
        if (actualEnd >= cleanText.length) break;

        // Calculate the next step
        // We normally step forward by length minus overlap.
        let step = chunk.length - overlap;

        // GUARD RAIL: If the chunk is smaller than the overlap (e.g. short scene),
        // step would be negative/zero, causing an infinite loop.
        // We force a minimum step of 1 to ensure forward momentum.
        if (step < 1) {
            step = 1; 
        }

        start += step; 
    }
    
    console.log(`[Chunker] Processed ${cleanText.length} chars into ${chunks.length} chunks.`);
    return chunks;
}

// 3. The Vector Object Builder
export function createVectorObject(text, embedding, sourceName, meta = {}) {
    return {
        id: uuidv4(),
        text: text,
        embedding: embedding, 
        source: sourceName,
        timestamp: Date.now(),
        meta: meta 
    };
}