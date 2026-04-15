const mysql = require('mysql2/promise');
require('dotenv').config();

async function listDatabases() {
    const connection = await mysql.createConnection({
        host: 'switchyard.proxy.rlwy.net',
        port: 23368,
        user: 'root',
        password: 'beKnAPlVQygcLemMQfdfWIWCqnESGwQa',
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        const [rows] = await connection.query('SHOW DATABASES');
        console.log('Databases List:');
        rows.forEach(row => {
            console.log(Object.values(row)[0]);
        });
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await connection.end();
    }
}

listDatabases();
