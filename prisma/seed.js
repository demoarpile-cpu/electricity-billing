const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding database...');

    // 1. Create ADMIN
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.upsert({
        where: { email: 'admin@powerbill.com' },
        update: { password: adminPassword }, // 🔥 FORCE RESET PASSWORD
        create: {
            name: 'Super Admin',
            email: 'admin@powerbill.com',
            password: adminPassword,
            role: 'ADMIN',
        },
    });

    // 2. Create OPERATOR
    const operatorPassword = await bcrypt.hash('operator123', 10);
    const operatorUser = await prisma.user.upsert({
        where: { email: 'operator@powerbill.com' },
        update: { password: operatorPassword }, // 🔥 FORCE RESET PASSWORD
        create: {
            name: 'Main Operator',
            email: 'operator@powerbill.com',
            password: operatorPassword,
            role: 'OPERATOR',
            operator: {
                create: {},
            },
        },
    });

    // 3. Create CONSUMERS
    const consumers = [
        { name: 'John Doe', email: 'john@example.com', meter: 'MTR-1001', addr: '123 Street, Springfield' },
        { name: 'Jane Smith', email: 'jane@example.com', meter: 'MTR-1002', addr: '456 Avenue, Metropolis' },
        { name: 'Alice Johnson', email: 'alice@example.com', meter: 'MTR-1003', addr: '789 Road, Gotham' },
    ];

    const consumerPassword = await bcrypt.hash('consumer123', 10);

    for (const c of consumers) {
        const user = await prisma.user.upsert({
            where: { email: c.email },
            update: { password: consumerPassword }, 
            create: {
                name: c.name,
                email: c.email,
                password: consumerPassword,
                role: 'CONSUMER',
                consumer: {
                    create: {
                        meterNumber: c.meter,
                        address: c.addr,
                        connectionType: 'RESIDENTIAL',
                        status: 'ACTIVE',
                        lastReading: 1200,
                    },
                },
            },
            include: { consumer: true }
        });

        // 4. Create METER for live dashboard
        if (user.consumer) {
            await prisma.meter.upsert({
                where: { meterId: c.meter },
                update: {},
                create: {
                    consumerId: user.consumer.id,
                    meterId: c.meter,
                    meterName: `Meter ${c.meter}`,
                    connectionType: 'TCP',
                    ipAddress: '127.0.0.1',
                    port: 502,
                    status: 'Disconnected',
                    registers: {
                        create: [
                            { label: 'Voltage', address: '1', dataType: 'Float' },
                            { label: 'Current', address: '3', dataType: 'Float' },
                            { label: 'Power', address: '5', dataType: 'Float' },
                            { label: 'Energy', address: '7', dataType: 'Float' }
                        ]
                    }
                }
            });
        }
    }

    console.log('Database seeded successfully!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
