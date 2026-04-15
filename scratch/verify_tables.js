const prisma = require('../src/config/prisma');

async function listAllTables() {
    try {
        const rows = await prisma.$queryRawUnsafe('SHOW TABLES;');
        console.log('Current tables in database:');
        console.log('Current tables in database:', JSON.stringify(rows, null, 2));
    } catch (err) {
        console.error('Error listing tables:', err.message);
    } finally {
        await prisma.$disconnect();
    }
}

setTimeout(listAllTables, 2000);
