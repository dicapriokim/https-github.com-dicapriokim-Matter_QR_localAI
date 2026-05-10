const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 8099;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Support large payloads (images/backups)

// Integrity Check Middleware
function checkIntegrity(req, res, next) {
    const signature = "돼지지렁이";
    // We check for the unicode escape sequence as it might appear in the source code file
    const signatureEscaped = "\\ub3fc\\uc9c0\\uc9c0\\ub801\\uc774";

    const p1 = path.join(__dirname, 'public', 'index.html');
    const p2 = path.join(__dirname, 'public', 'script.js');

    try {
        const c1 = fs.readFileSync(p1, 'utf8');
        const c2 = fs.readFileSync(p2, 'utf8');

        // Check file 1 (index.html uses literal)
        const check1 = c1.includes(signature);

        // Check file 2 (script.js might use escaped unicode)
        const check2 = c2.includes(signature) || c2.includes(signatureEscaped);

        if (!check1 || !check2) {
            console.error("Integrity Check Failed: Signature missing.");
            return res.status(403).send("Forbidden: Integrity Check Failed");
        }
        next();
    } catch (e) {
        console.error("Integrity Check Error:", e);
        return res.status(500).send("Internal Server Error: Integrity Check");
    }
}

// Apply Integrity Check Globally (before static files)
app.use(checkIntegrity);

app.use(express.static('public'));

// Paths
// In Home Assistant Add-ons, persistent data is stored in /data
const DATA_DIR = '/data';
const DATA_FILE = path.join(DATA_DIR, 'matter_data.json');
const CONFIG_FILE = path.join(DATA_DIR, 'options.json');

// Local fallback for development
const LOCAL_DATA_FILE = path.join(__dirname, 'matter_data.json');
const LOCAL_CONFIG_FILE = path.join(__dirname, 'options.json');

const isProd = fs.existsSync(DATA_DIR);
const dataPath = isProd ? DATA_FILE : LOCAL_DATA_FILE;
const configPath = isProd ? CONFIG_FILE : LOCAL_CONFIG_FILE;

console.log(`Starting Matter Code Vault Server...`);
console.log(`Environment: ${isProd ? 'Production (HA)' : 'Development'}`);
console.log(`Data Path: ${dataPath}`);

// ensure dev file exists if not prod
if (!isProd && !fs.existsSync(dataPath)) {
    try {
        fs.writeFileSync(dataPath, '[]');
        console.log("Created local data file.");
    } catch (e) {
        console.error("Failed to create local data file:", e);
    }
}

// API: Get Configuration (Force Fresh Read)
app.get('/api/config', (req, res) => {
    // Check file existence every time to avoid stale logic
    if (fs.existsSync(configPath)) {
        try {
            // Read file directly from disk every time
            const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            res.json(config);
        } catch (e) {
            console.error("Config read error:", e);
            res.status(500).json({ error: "Failed to read config" });
        }
    } else {
        res.json({});
    }
});

// API: Update Configuration (Removed for security/unification)
// app.post('/api/config') is deleted. API Key is managed via Home Assistant Options only.

// API: Get Data (Read devices list)
app.get('/api/data', (req, res) => {
    if (fs.existsSync(dataPath)) {
        try {
            const fileContent = fs.readFileSync(dataPath, 'utf8');
            // Handle empty file case
            const data = fileContent.trim() ? JSON.parse(fileContent) : [];
            res.json(data);
        } catch (e) {
            console.error("Data read error:", e);
            res.status(500).json({ error: "Failed to read data" });
        }
    } else {
        res.json([]); // Return empty array if file doesn't exist yet
    }
});

// API: Save Data (Write devices list)
app.post('/api/data', (req, res) => {
    try {
        // Validate that body is an array or object as expected
        const data = req.body;
        fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
        res.json({ success: true });
    } catch (e) {
        console.error("Data write error:", e);
        res.status(500).json({ error: "Failed to save data" });
    }
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on port ${PORT}`);
});
