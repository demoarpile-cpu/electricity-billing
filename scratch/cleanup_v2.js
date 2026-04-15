const prisma = require('../src/config/prisma');

const tablesToRemove = [
    'batches',
    'bundles',
    'bundle_items',
    'categories',
    'companies',
    'customers',
    'cycle_counts',
    'goods_receipts',
    'goods_receipt_items',
    'inventory',
    'inventory_adjustments',
    'inventory_logs',
    'locations',
    'order_items',
    'packing_tasks',
    'pick_lists',
    'pick_list_items',
    'production_formulas',
    'production_formula_items',
    'production_orders',
    'production_order_items',
    'products',
    'product_stocks'
];

async function removeExtraTables() {
    console.log('Starting cleanup of extra tables using app config...');
    
    try {
        await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 0;');
        console.log('Foreign key checks disabled.');

        for (const table of tablesToRemove) {
            try {
                console.log(`Dropping table: ${table}...`);
                await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS \`${table}\`;`);
                console.log(`✅ Table ${table} dropped.`);
            } catch (err) {
                console.error(`❌ Failed to drop table ${table}:`, err.message);
            }
        }

        await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1;');
        console.log('Foreign key checks enabled.');
        console.log('Cleanup complete!');
    } catch (err) {
        console.error('Critical error during setup:', err.message);
    } finally {
        await prisma.$disconnect();
    }
}

// Wait a bit for the prisma.js initial connect with retry to finish or at least start
setTimeout(removeExtraTables, 2000);
