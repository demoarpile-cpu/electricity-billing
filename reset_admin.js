const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function resetAdmin() {
    const password = await bcrypt.hash('admin123', 10);
    const user = await prisma.user.update({
        where: { email: 'admin@powerbill.com' },
        data: { password }
    });
    console.log('Admin password reset successful!');
    await prisma.$disconnect();
}

resetAdmin();
