const mysql = require('mysql2/promise');
require('dotenv').config();

async function listAllTables() {
    const connection = await mysql.createConnection({
        host: 'switchyard.proxy.rlwy.net',
        port: 23368,
        user: 'root',
        password: 'beKnAPlVQygcLemMQfdfWIWCqnESGwQa',
        database: 'railway',
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        const [rows] = await connection.query('SHOW TABLES');
        console.log(`Total Tables Found: ${rows.length}`);
        console.log('Tables List:');
        rows.forEach(row => {
            console.log(Object.values(row)[0]);
        });
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await connection.end();
    }
}

listAllTables();
