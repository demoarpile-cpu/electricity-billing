const prisma = require('./src/config/prisma');

async function main() {
    try {
        const meters = await prisma.meter.findMany({
            include: { registers: true }
        });
        const readings = await prisma.meterReading.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' }
        });
        console.log('METERS_START');
        console.log(JSON.stringify(meters, null, 2));
        console.log('METERS_END');
        console.log('READINGS_START');
        console.log(JSON.stringify(readings, null, 2));
        console.log('READINGS_END');
    } catch (error) {
        console.error('Error fetching meters:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
