/**
 * ⚡ POWERBILL ZERO-DEPENDENCY SIMULATOR
 * Use this to verify Live Dashboard WITHOUT installing any new libraries.
 * Powered by: Node.js Native HTTP
 */

const http = require('http');

const CONFIG = {
    hostname: "127.0.0.1",
    port: 5000,
    path: "/api/meters/meter-data",
    meterIp: "10.25.1.51", // Salman's IP
    slaveId: 33,           // Salman's Slave ID
    interval: 3000         
};

console.log("\x1b[35m%s\x1b[0m", "==========================================");
console.log("\x1b[35m%s\x1b[0m", "   🚀 ZERO-DEPENDENCY LIVE SIMULATOR 🚀  ");
console.log("\x1b[35m%s\x1b[0m", "==========================================");

function generateReading() {
    return JSON.stringify({
        agentId: "SIMULATOR-01",
        meterIp: CONFIG.meterIp,
        slaveId: CONFIG.slaveId,
        voltage: (230 + Math.random() * 5).toFixed(2),
        current: (10 + Math.random() * 2).toFixed(2),
        power: (2.3 + Math.random() * 0.5).toFixed(2),
        energy: (1240.5 + Math.random() * 0.1).toFixed(2),
        status: "Active"
    });
}

function pushData() {
    const data = generateReading();
    const options = {
        hostname: CONFIG.hostname,
        port: CONFIG.port,
        path: CONFIG.path,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': data.length
        }
    };

    const req = http.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
            console.log(`\x1b[32m[SENT]\x1b[0m Payload Delivered (Status: ${res.statusCode})`);
        });
    });

    req.on('error', (e) => {
        console.log(`\x1b[31m[FAIL]\x1b[0m Connection Error: ${JSON.stringify(e)}`);
    });

    req.write(data);
    req.end();
}

console.log(`\n\x1b[36m[STATE]\x1b[0m Simulation Started. Every ${CONFIG.interval/1000}s...`);

setInterval(pushData, CONFIG.interval);
pushData(); // Run once immediately
