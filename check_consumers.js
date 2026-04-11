const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    const consumers = await prisma.consumer.findMany({ include: { user: true } });
    console.log('Consumers:', consumers.map(c => ({ id: c.id, name: c.user.name, meter: c.meterNumber })));
    process.exit(0);
}
main();
