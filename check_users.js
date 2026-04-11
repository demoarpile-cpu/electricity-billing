const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function checkUsers() {
    try {
        const userCount = await prisma.user.count();
        console.log(`User count in DB: ${userCount}`);
        const users = await prisma.user.findMany({ select: { email: true, role: true } });
        console.log('Users found:', users);
    } catch (err) {
        console.error('Error checking users:', err);
    } finally {
        await prisma.$disconnect();
    }
}

checkUsers();
