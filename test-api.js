const fs = require('fs');
const path = require('path');
const https = require('https');

// Robust .env parser
function loadEnv() {
    try {
        const envPath = path.resolve(__dirname, '.env');
        if (!fs.existsSync(envPath)) {
            console.error(`❌ .env file not found at ${envPath}`);
            return {};
        }
        const envContent = fs.readFileSync(envPath, 'utf8');
        const env = {};
        envContent.split(/[\r\n]+/).forEach(line => {
            line = line.trim();
            if (!line || line.startsWith('#')) return; // Skip empty lines and comments

            const match = line.match(/^\s*([^=]+?)\s*=\s*(.*)?$/);
            if (match) {
                const key = match[1];
                let value = match[2] || '';
                // Remove quotes if present
                if ((value.startsWith('"') && value.endsWith('"')) ||
                    (value.startsWith("'") && value.endsWith("'"))) {
                    value = value.substring(1, value.length - 1);
                }
                env[key] = value;
            }
        });
        return env;
    } catch (e) {
        console.error("Could not read .env file:", e.message);
        return {};
    }
}

const env = loadEnv();
const API_KEY = env.GOOGLE_MAPS_API_KEY;

console.log("Environment Keys Found:", Object.keys(env));

if (!API_KEY) {
    console.error("❌ No GOOGLE_MAPS_API_KEY found in .env file");
    console.error("Please explicitly set GOOGLE_MAPS_API_KEY=AIza... in your .env file.");
    process.exit(1);
}

console.log(`🔑 Testing API Key: ${API_KEY.substring(0, 5)}...`);

const data = JSON.stringify({
    textQuery: "Googleplex in Mountain View"
});

const options = {
    hostname: 'places.googleapis.com',
    path: '/v1/places:searchText',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': API_KEY,
        'X-Goog-FieldMask': 'places.displayName,places.formattedAddress',
        // 'Referer': 'chrome-extension://echciaebnhonikdfhhdbebdnldcmekfa/' // Spoof extension
    }
};

console.log("📡 Sending request to https://places.googleapis.com/v1/places:searchText...");

const req = https.request(options, (res) => {
    let body = '';

    res.on('data', (chunk) => {
        body += chunk;
    });

    res.on('end', () => {
        console.log(`\nResponse Status: ${res.statusCode} ${res.statusMessage}`);

        try {
            const parsed = JSON.parse(body);
            if (res.statusCode === 200) {
                console.log("✅ SUCCESS! The API Key works and the Places API (New) is enabled.");
            } else {
                console.error("❌ API ERROR:");
                console.error(JSON.stringify(parsed, null, 2));

                if (parsed.error) {
                    if (parsed.error.status === 'PERMISSION_DENIED') {
                        console.log("\n💡 DIAGNOSIS:");
                        if (parsed.error.message.includes('not authorized')) {
                            console.log("-> This looks like a 'REFERER' restriction. The key expects 'chrome-extension://...' but this script sent none.");
                            console.log("-> If you see this, it means your RESTRICTION IS WORKING! To confirm, temporarily UNRESTRICT the key in Cloud Console and run this test again.");
                        } else if (parsed.error.message.includes('API has not been used') || parsed.error.message.includes('not enabled')) {
                            console.log("-> You must ENABLE 'Places API (New)' in Cloud Console Library.");
                        }
                    }
                }
            }
        } catch (e) {
            console.log("Raw Body:", body);
        }
    });
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

req.write(data);
req.end();
