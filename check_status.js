const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const bills = await prisma.bill.findMany({
        select: { id: true, billNumber: true, status: true, consumer: { select: { user: { select: { name: true } } } } }
    });
    console.log('Bills with Status:', JSON.stringify(bills, null, 2));
    await prisma.$disconnect();
}

check();
