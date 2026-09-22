// js/ingestion/lorepack.js
// THE FORGE UI CONTROLLER v5.4 [UX POLISH]
// Features: Explicit Download Feedback, Manual Re-Download

import { chunkText, createVectorObject } from './ingestion.js';
import { apiCall } from '../core/mythos-engine.js';

let MASTER_ARTIFACT = null; // Store result in memory for re-download
let LAST_FILENAME = "";

export function bindLorepackUI() {
    const fileInput = document.getElementById('fileInput');
    const ingestBtn = document.getElementById('ingestBtn');
    const progressBar = document.getElementById('progressBar');
    const progressLabel = document.getElementById('progressLabel');
    const queueList = document.getElementById('queueList');
    
    // Dashboard Refs
    const ui = {
        timer: document.getElementById('timerDisplay'),
        threads: document.getElementById('statThreads'),
        chunks: document.getElementById('statChunks'),
        vectors: document.getElementById('statVectors'),
        speed: document.getElementById('statSpeed')
    };

    let fileQueue = [];

    // 1. File Selection
    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            fileQueue = files;
            if (document.getElementById('fileCount')) {
                document.getElementById('fileCount').textContent = `${files.length} FILES STAGED`;
            }
            
            // Reset Button if we pick new files
            ingestBtn.textContent = "IGNITE FORGE";
            ingestBtn.onclick = igniteProcess; 
            
            if(queueList) {
                queueList.innerHTML = files.map(f => 
                    `<div class="file-item"><span>${f.name}</span><span class="file-status">READY</span></div>`
                ).join('');
            }
        });
    }

    // 2. The Process Logic (Named function to handle button state swapping)
    const igniteProcess = async () => {
        // --- CHECK RE-DOWNLOAD STATE ---
        if (ingestBtn.textContent.includes("DOWNLOAD AGAIN")) {
            downloadLorepack(MASTER_ARTIFACT, LAST_FILENAME);
            return;
        }

        // --- SETUP ---
        const rawKey = document.getElementById('apiKey').value || '';
        const keyList = rawKey.split(/[\r\n]+/).map(k => k.trim()).filter(k => k.length > 0);
        if (keyList.length === 0) { alert("CRITICAL: API KEY MISSING"); return; }
        let apiKey = keyList[0].replace(/['"]/g, '');
        
        const agentId = document.getElementById('agentId').value || 'MYTHOS';
        const concurrency = parseInt(document.getElementById('concurrency').value) || 5;

        if (fileQueue.length === 0) { alert("NO FILES"); return; }

        // --- LOCK UI ---
        ingestBtn.disabled = true;
        ingestBtn.textContent = "PROCESSING...";
        let startTime = Date.now();
        let totalVectors = 0;
        MASTER_ARTIFACT = []; // Reset global
        
        // --- STAGE 1: CHUNKING ---
        if(progressLabel) progressLabel.textContent = "PHASE 1: CHUNKING TEXT...";
        
        let allChunks = [];
        
        for (let i = 0; i < fileQueue.length; i++) {
            const file = fileQueue[i];
            try {
                const text = await file.text();
                const chunks = chunkText(text);
                chunks.forEach(txt => {
                    allChunks.push({ text: txt, source: file.name });
                });

                if(queueList && queueList.children[i]) {
                    queueList.children[i].querySelector('.file-status').innerHTML = '<span style="color:#ffff00">CHUNKING...</span>';
                }
            } catch (e) {
                console.error(`Failed to read ${file.name}`);
            }
        }

        if(ui.chunks) ui.chunks.textContent = allChunks.length;
        if(ui.threads) ui.threads.textContent = concurrency;

        // --- STAGE 2: VECTORIZATION ---
        if(progressLabel) progressLabel.textContent = `PHASE 2: EMBEDDING (${allChunks.length} ITEMS)`;
        
        let completed = 0;
        
        // Timer
        const timerInterval = setInterval(() => {
            const diff = Math.floor((Date.now() - startTime) / 1000);
            const mins = Math.floor(diff / 60).toString().padStart(2, '0');
            const secs = (diff % 60).toString().padStart(2, '0');
            if(ui.timer) ui.timer.textContent = `${mins}:${secs}`;
            
            const spd = (completed / (diff || 1)).toFixed(1);
            if(ui.speed) ui.speed.textContent = `${spd}/s`;
        }, 1000);

        // Worker Function
        const processChunk = async (item) => {
            try {
                const res = await apiCall('embed', { 
                    text: item.text, 
                    model: "text-embedding-004" 
                }, apiKey);

                if (res.embedding) {
                    const vecObj = createVectorObject(item.text, res.embedding.values, item.source, { agent: agentId });
                    MASTER_ARTIFACT.push(vecObj);
                    totalVectors++;
                }
            } catch (err) {
                console.warn(`Embed fail: ${err.message}`);
            } finally {
                completed++;
                const pct = Math.round((completed / allChunks.length) * 100);
                if(progressBar) progressBar.value = pct;
                if(ui.vectors) ui.vectors.textContent = completed;
            }
        };

        // Run Pool
        await runConcurrencyPool(allChunks, processChunk, concurrency);

        // --- STAGE 3: FINISH ---
        clearInterval(timerInterval);
        
        Array.from(queueList.children).forEach(row => {
            row.querySelector('.file-status').innerHTML = '<span style="color:#00ffaa">BAKED</span>';
        });

        if (MASTER_ARTIFACT.length > 0) {
            // Auto Download
            LAST_FILENAME = `LOREPACK_${agentId}_${Date.now()}.json`;
            downloadLorepack(MASTER_ARTIFACT, LAST_FILENAME);
            
            // Visual Feedback
            if(progressLabel) {
                progressLabel.innerHTML = `SUCCESS. SAVED TO DOWNLOADS: <b style="color:#00ffaa">${LAST_FILENAME}</b>`;
            }
            
            // Button State Change
            ingestBtn.textContent = "DOWNLOAD AGAIN";
            ingestBtn.className = "primary"; // Keep it green/active
        } else {
            if(progressLabel) progressLabel.textContent = "FAILURE: 0 VECTORS GENERATED.";
            ingestBtn.textContent = "RETRY";
        }

        ingestBtn.disabled = false;
        
        // Remove old listener, attach new one handles by the logic above
        // Actually, we just keep 'igniteProcess' but it checks the textContent at the top.
    };

    // Bind initial
    if (ingestBtn) ingestBtn.addEventListener('click', igniteProcess);
}

// --- CONCURRENCY HELPER ---
async function runConcurrencyPool(items, asyncFn, poolSize) {
    const queue = [...items];
    const active = [];
    
    while (queue.length > 0 || active.length > 0) {
        while (active.length < poolSize && queue.length > 0) {
            const item = queue.shift();
            const promise = asyncFn(item);
            const pWrapper = promise.then(() => {
                active.splice(active.indexOf(pWrapper), 1);
            });
            active.push(pWrapper);
        }
        if (active.length > 0) {
            await Promise.race(active);
        }
    }
}

// --- EXPORT ---
function downloadLorepack(data, filenameOrName) {
    // If passed a full filename (ends in .json), use it. Otherwise construct it.
    const fileName = filenameOrName.endsWith('.json') 
        ? filenameOrName 
        : `LOREPACK_${filenameOrName}_${Date.now()}.json`;

    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}