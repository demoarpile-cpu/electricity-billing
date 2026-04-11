const mysql = require('mysql2/promise');

async function check() {
    const conn = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'powerbill_db',
        port: 3306
    });

    console.log('Connected to local powerbill_db!');

    const [tables] = await conn.query('SHOW TABLES');
    console.log('Tables:', tables);

    try {
        const [users] = await conn.query('SELECT id, email, role FROM users LIMIT 10');
        console.log('Users:', users);
    } catch (e) {
        console.log('users table error:', e.message);
    }

    await conn.end();
}

check().catch(console.error);
