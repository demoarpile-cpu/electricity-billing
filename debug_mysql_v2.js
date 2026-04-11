const mysql = require('mysql2/promise');
require('dotenv').config();

async function test() {
    const configs = [
        { name: 'Host: turntable.proxy.rlwy.net', host: 'turntable.proxy.rlwy.net', port: 40890 },
        { name: 'Host: 66.33.22.229', host: '66.33.22.229', port: 40890 }
    ];

    for (const config of configs) {
        console.log(`\n=== Testing ${config.name} ===`);
        try {
            console.log('Connecting...');
            const conn = await mysql.createConnection({
                host: config.host,
                port: config.port,
                user: 'root',
                password: 'MTmgvocwiwcWRQvdLTONGBhWglgyVAKE',
                database: 'railway',
                connectTimeout: 10000,
                // debug: true // This would give lots of output
            });
            console.log('✅ Connected successfully!');
            await conn.end();
        } catch (err) {
            console.error('❌ Failed:', err.message);
            console.error('Code:', err.code);
            console.error('Fatal:', err.fatal);
        }
    }
}

test();
