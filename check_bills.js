const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const bills = await prisma.bill.findMany({
        take: 10,
        select: { id: true, billNumber: true, totalAmount: true }
    });
    console.log('Sample Bills in DB:', JSON.stringify(bills, null, 2));
    await prisma.$disconnect();
}

check();
