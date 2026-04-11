const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Checking System Settings...');
  try {
    const settings = await prisma.systemSetting.findFirst();
    if (settings) {
      console.log('✅ Settings exist:', settings);
    } else {
      console.log('⚠️ No settings found. Creating default...');
      const newSettings = await prisma.systemSetting.create({
        data: {
          id: 1, // Explicitly set ID 1
          residentialRate: 6,
          commercialRate: 8,
          industrialRate: 12,
          taxPercent: 5
        }
      });
      console.log('✅ Created default settings:', newSettings);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
