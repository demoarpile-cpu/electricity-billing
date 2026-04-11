const mysql = require('mysql2');
require('dotenv').config();

const config = {
    host: 'turntable.proxy.rlwy.net',
    port: 40890,
    user: 'root',
    password: 'MTmgvocwiwcWRQvdLTONGBhWglgyVAKE',
    connectTimeout: 20000
};

console.log('Testing connection WITHOUT database name...');
const conn = mysql.createConnection(config);

conn.connect((err) => {
    if (err) {
        console.error('Failed:', err.message, err.code);
    } else {
        console.log('SUCCESS! Authenticated.');
        conn.end();
    }
});
