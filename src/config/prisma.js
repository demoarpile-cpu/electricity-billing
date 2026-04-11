const { PrismaClient } = require('@prisma/client');

/**
 * Senior Backend Engineer Implementation:
 * Robust Prisma Client Initialization with Error Handling & Retry Logic.
 */

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL
        }
    },
    log: process.env.NODE_ENV === 'development'
        ? ['query', 'info', 'warn', 'error']
        : ['error', 'warn'],
    errorFormat: 'pretty',
});

const connectWithRetry = async (retries = 5, interval = 5000) => {
    for (let i = 0; i < retries; i++) {
        try {
            await prisma.$connect();
            console.log('✅ Database connected successfully.');
            return;
        } catch (err) {
            console.error(`❌ Database connection attempt ${i + 1} failed:`, err.message);
            if (i < retries - 1) {
                console.log(`Retrying in ${interval / 1000}s...`);
                await new Promise(resolve => setTimeout(resolve, interval));
            } else {
                console.error('💥 All database connection attempts failed. The application will continue running but DB operations will fail.');
            }
        }
    }
};

// Initial connection attempt (Non-blocking to allow server to start)
connectWithRetry();

// Handle graceful shutdown
process.on('SIGINT', async () => {
    await prisma.$disconnect();
    process.exit(0);
});

module.exports = prisma;

