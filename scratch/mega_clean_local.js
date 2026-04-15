const mysql = require('mysql2/promise');

const keepTables = [
    'users',
    'notifications',
    'consumers',
    'meters',
    'registers',
    'operators',
    'bills',
    'payments',
    'meter_readings',
    'complaints',
    'system_settings',
    '_prisma_migrations'
];

async function megaCleanLocal() {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'powerbill_db'
        });

        console.log('Connected to LOCAL powerbill_db. Starting Mega Clean...');

        const [rows] = await connection.query('SHOW TABLES');
        const allTables = rows.map(row => Object.values(row)[0]);
        
        const tablesToRemove = allTables.filter(table => !keepTables.includes(table));
        
        console.log(`Found ${tablesToRemove.length} tables to remove.`);

        await connection.query('SET FOREIGN_KEY_CHECKS = 0;');
        
        for (const table of tablesToRemove) {
            try {
                console.log(`Dropping table: ${table}...`);
                await connection.query(`DROP TABLE \`${table}\`;`);
                console.log(`✅ ${table} removed.`);
            } catch (err) {
                console.error(`❌ Failed to remove ${table}:`, err.message);
            }
        }

        await connection.query('SET FOREIGN_KEY_CHECKS = 1;');
        console.log('Mega Clean Complete! Only required tables remain.');

    } catch (err) {
        console.error('Error during Mega Clean:', err.message);
    } finally {
        if (connection) await connection.end();
    }
}

megaCleanLocal();
