const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const payments = await prisma.payment.findMany({ select: { id: true, amount: true } });
    console.log('Total Payments in DB:', payments.length);
    await prisma.$disconnect();
}

check();
