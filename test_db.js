const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

// Explicitly use the DATABASE_URL from .env
const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL + "&sslmode=no-verify&allowPublicKeyRetrieval=true",
        },
    },
    log: ['query', 'info', 'warn', 'error'],
});

async function testConnection() {
    console.log('Testing connection to:', process.env.DATABASE_URL.split('@')[1]); // Log host part for safety
    try {
        const userCount = await prisma.user.count();
        console.log(`✅ Success! User count: ${userCount}`);

        const users = await prisma.user.findMany({
            take: 5,
            select: { email: true, role: true }
        });
        console.log('Users:', users);
    } catch (err) {
        console.error('❌ Connection Failed:', err.message);
        if (err.code) console.error('Error Code:', err.code);
        console.error('Full Error:', err);
    } finally {
        await prisma.$disconnect();
    }
}

testConnection();
