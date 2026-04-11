const mysql = require('mysql2');
require('dotenv').config();

const config = {
    host: '66.33.22.229',
    port: 40890,
    user: 'root',
    password: 'MTmgvocwiwcWRQvdLTONGBhWglgyVAKE',
    database: 'railway',
    connectTimeout: 30000,
    debug: true
};

console.log('--- Attempting connection with DEBUG enabled ---');
const conn = mysql.createConnection(config);

conn.on('error', (err) => {
    console.log('\n[EMITTED ERROR]:', err);
});

conn.connect((err) => {
    if (err) {
        console.error('\n[CONNECT ERROR]:', err);
    } else {
        console.log('\n[SUCCESS] Connected.');
        conn.end();
    }
});
