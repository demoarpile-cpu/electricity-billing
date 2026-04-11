const prisma = require('./src/config/prisma');
const bcrypt = require('bcryptjs');

async function main() {
    try {
        const hash = await bcrypt.hash('consumer123', 10);
        
        // 1. Create/Update User
        const user = await prisma.user.upsert({
            where: { email: 'john@example.com' },
            update: { password: hash, role: 'CONSUMER' },
            create: {
                name: 'John Doe',
                email: 'john@example.com',
                password: hash,
                role: 'CONSUMER'
            }
        });

        // 2. Create/Update Consumer Profile
        const consumer = await prisma.consumer.upsert({
            where: { userId: user.id },
            update: { meterNumber: 'MTR-1001' },
            create: {
                userId: user.id,
                meterNumber: 'MTR-1001',
                address: '123 Main St',
                connectionType: 'RESIDENTIAL',
                status: 'ACTIVE'
            }
        });

        // 3. Link to a Meter if not linked
        const existingMeter = await prisma.meter.findUnique({ where: { meterId: 'MTR-1001' } });
        if (!existingMeter) {
            await prisma.meter.create({
                data: {
                    consumerId: consumer.id,
                    meterId: 'MTR-1001',
                    meterName: 'Main Residential Meter',
                    connectionType: 'TCP',
                    ipAddress: '10.25.1.1',
                    port: 502,
                    status: 'Active',
                    registers: {
                        create: [
                            { label: 'Voltage', address: '40001', dataType: 'Float' },
                            { label: 'Current', address: '40002', dataType: 'Float' },
                            { label: 'Power', address: '40003', dataType: 'Float' },
                            { label: 'Energy', address: '40005', dataType: 'Float' }
                        ]
                    }
                }
            });
        }

        console.log('JOHN_SETUP_COMPLETE: john@example.com / consumer123');
    } catch (error) {
        console.error('Setup failed:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
