// server.js
// MYTHOS HYBRID SERVER v4.8
// Validates static serving for CSS/JS

import express from 'express';
import { createServer } from 'http';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import cors from 'cors';
import fs from 'fs';

// --- CONFIGURATION ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PORT = process.env.PORT || 4000;

const app = express();
const server = createServer(app);

// --- MIDDLEWARE ---
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// --- STATIC FILE SERVING (THE FIX) ---
// 1. Serve the root directory for HTML files
app.use(express.static(__dirname)); 

// 2. Explicitly serve CSS and JS folders to ensure MIME types are correct
app.use('/css', express.static(join(__dirname, 'css')));
app.use('/js', express.static(join(__dirname, 'js')));

// --- API ENDPOINTS ---

// MCP Proxy (Placeholder for your existing logic)
app.post('/mcp', async (req, res) => {
    // ... (Your MCP Logic here)
    res.status(501).json({ error: "MCP Proxy Not Connected in this stub." });
});

// --- STARTUP ---
server.listen(PORT, () => {
    console.log(`[MYTHOS] Server Online: http://localhost:${PORT}`);
    console.log(`[MYTHOS] Serving Static Content from: ${__dirname}`);
});