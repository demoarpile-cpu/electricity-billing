const mysql = require('mysql2/promise');
require('dotenv').config();

async function listTables() {
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
        console.log('Tables in database:');
        rows.forEach(row => {
            console.log(Object.values(row)[0]);
        });
    } catch (err) {
        console.error('Error listing tables:', err);
    } finally {
        await connection.end();
    }
}

listTables();
