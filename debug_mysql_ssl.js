const mysql = require('mysql2');
require('dotenv').config();

const config = {
    host: 'turntable.proxy.rlwy.net',
    port: 40890,
    user: 'root',
    password: 'MTmgvocwiwcWRQvdLTONGBhWglgyVAKE',
    database: 'railway',
    connectTimeout: 20000
};

console.log('--- Testing WITHOUT SSL ---');
const conn1 = mysql.createConnection(config);

conn1.connect((err) => {
    if (err) {
        console.error('Conn1 (No SSL) Failed:', err.message, err.code);
    } else {
        console.log('Conn1 (No SSL) Success!');
        conn1.end();
    }

    console.log('\n--- Testing WITH SSL (rejectUnauthorized: false) ---');
    const conn2 = mysql.createConnection({
        ...config,
        ssl: {
            rejectUnauthorized: false
        }
    });

    conn2.connect((err) => {
        if (err) {
            console.error('Conn2 (SSL) Failed:', err.message, err.code);
        } else {
            console.log('Conn2 (SSL) Success!');
            conn2.end();
        }
        process.exit();
    });
});
