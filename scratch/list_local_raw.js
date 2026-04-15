const mysql = require('mysql2/promise');

async function listLocalTables() {
    try {
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'powerbill_db'
        });

        const [rows] = await connection.query('SHOW TABLES');
        console.log(`Total Tables Found in LOCAL powerbill_db: ${rows.length}`);
        console.log('Tables List:');
        rows.forEach(row => {
            console.log(Object.values(row)[0]);
        });
        await connection.end();
    } catch (err) {
        console.error('Error connecting to LOCAL database:', err.message);
    }
}

listLocalTables();
