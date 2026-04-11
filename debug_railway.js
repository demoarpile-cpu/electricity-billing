const mysql = require('mysql2');
require('dotenv').config();

const url = "mysql://root:MTmgvocwiwcWRQvdLTONGBhWglgyVAKE@turntable.proxy.rlwy.net:40890";

console.log('Attempting to connect to Railway MySQL...');
const connection = mysql.createConnection({
    uri: "mysql://root:MTmgvocwiwcWRQvdLTONGBhWglgyVAKE@turntable.proxy.rlwy.net:40890/railway",
    ssl: {
        rejectUnauthorized: false
    },
    connectTimeout: 10000
});

connection.connect((err) => {
    if (err) {
        console.error('Connection failed details:', err);
        return;
    }
    console.log('SUCCESS! Connected to Railway DB.');
    connection.query('SELECT 1 + 1 AS solution', (err, rows) => {
        if (err) console.error('Query error:', err);
        else console.log('The solution is: ', rows[0].solution);
        connection.end();
    });
});
