const prisma = require('../config/prisma');
const { createNotification } = require('./notification.controller');

// Helper: calculate bill amount
const calculateBill = async (consumerType, prevReading, currReading) => {
    const settings = await prisma.systemSetting.findFirst() || { residentialRate: 6, commercialRate: 8, industrialRate: 12, taxPercent: 5 };
    
    let rate = settings.residentialRate;
    if (consumerType === 'COMMERCIAL') rate = settings.commercialRate;
    if (consumerType === 'INDUSTRIAL') rate = settings.industrialRate;

    const units = Math.max(0, currReading - prevReading);
    const baseAmount = units * rate;
    const taxAmount = baseAmount * (settings.taxPercent / 100);
    const totalAmount = baseAmount + taxAmount;
    
    return { units, baseAmount, taxAmount, totalAmount, ratePerUnit: rate, taxPercent: settings.taxPercent };
};

// ─────────────────────────────────────────
// POST /api/bills/generate-all (Admin)
// ─────────────────────────────────────────
const generateAllBills = async (req, res) => {
    try {
        const { billMonth, dueDate } = req.body;
        if (!billMonth || !dueDate) return res.status(400).json({ success: false, message: 'billMonth and dueDate are required.' });

        const consumers = await prisma.consumer.findMany({ include: { user: { select: { id: true, name: true } } } });
        const results = { created: 0, skipped: 0, errors: 0 };

        for (const consumer of consumers) {
            try {
                const existing = await prisma.bill.findFirst({ where: { consumerId: consumer.id, billMonth } });
                if (existing) { results.skipped++; continue; }

                const prevReading = consumer.lastReading;
                const { units, baseAmount, taxAmount, totalAmount, ratePerUnit, taxPercent } = await calculateBill(consumer.connectionType, prevReading, prevReading);

                await prisma.bill.create({
                    data: {
                        consumer: { connect: { id: consumer.id } },
                        prevReading,
                        currReading: prevReading,
                        units, baseAmount, ratePerUnit, taxPercent, taxAmount, totalAmount,
                        dueDate: new Date(dueDate), billMonth, status: 'PENDING',
                    }
                });
                results.created++;
            } catch (err) { results.errors++; }
        }
        res.status(200).json({ success: true, message: `Completed. Created: ${results.created}, Skipped: ${results.skipped}`, data: results });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error during generation.' });
    }
};

// ─────────────────────────────────────────
// GET /api/bills (Admin)
// ─────────────────────────────────────────
const getAllBills = async (req, res) => {
    try {
        const { status, consumerId } = req.query;
        const where = {};
        if (status && status !== 'All') where.status = status.toUpperCase();
        if (consumerId) where.consumerId = Number(consumerId);

        const bills = await prisma.bill.findMany({
            where,
            include: {
                consumer: { include: { user: { select: { name: true } } } },
                operator: { include: { user: { select: { name: true } } } },
            },
            orderBy: { createdAt: 'desc' },
        });

        const formatted = bills.map((b) => ({
            id: b.id,
            billNumber: b.billNumber,
            consumerName: b.consumer.user.name,
            consumerId: b.consumerId,
            meterNumber: b.consumer.meterNumber,
            prevReading: b.prevReading,
            currReading: b.currReading,
            units: b.units,
            amount: b.totalAmount,
            dueDate: b.dueDate,
            billMonth: b.billMonth,
            status: b.status,
            generatedBy: b.operator?.user?.name || 'Admin',
            createdAt: b.createdAt,
        }));
        res.status(200).json({ success: true, data: formatted });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ─────────────────────────────────────────
// GET /api/bills/my (Consumer)
// ─────────────────────────────────────────
const getMyBills = async (req, res) => {
    try {
        const consumer = await prisma.consumer.findUnique({ where: { userId: req.user.id } });
        if (!consumer) return res.status(404).json({ success: false, message: 'Consumer not found.' });
        const bills = await prisma.bill.findMany({ where: { consumerId: consumer.id }, orderBy: { createdAt: 'desc' } });
        res.status(200).json({ success: true, data: bills });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ─────────────────────────────────────────
// POST /api/bills/generate
// ─────────────────────────────────────────
const generateBill = async (req, res) => {
    try {
        const { consumerId, currReading, dueDate, billMonth } = req.body;
        
        // Validation: Check for missing or invalid consumerId
        const parsedConsumerId = parseInt(consumerId);
        if (isNaN(parsedConsumerId)) {
            return res.status(400).json({ success: false, message: 'Invalid consumerId. It must be a number.' });
        }

        const consumer = await prisma.consumer.findUnique({ where: { id: parsedConsumerId } });
        if (!consumer) return res.status(404).json({ success: false, message: 'Consumer not found.' });

        // Prevent duplicate
        const existing = await prisma.bill.findFirst({ where: { consumerId: parsedConsumerId, billMonth } });
        if (existing) return res.status(400).json({ success: false, message: 'Bill already exists for this month.' });

        const parsedCurrReading = Number(currReading);
        if (isNaN(parsedCurrReading)) {
            return res.status(400).json({ success: false, message: 'Invalid current reading. It must be a number.' });
        }

        const { units, totalAmount, ratePerUnit, taxPercent, baseAmount, taxAmount } = await calculateBill(consumer.connectionType, consumer.lastReading, parsedCurrReading);
        
        const bill = await prisma.bill.create({
            data: { 
                consumer: { connect: { id: parsedConsumerId } },
                prevReading: consumer.lastReading, 
                currReading: parsedCurrReading, 
                units, baseAmount, ratePerUnit, taxPercent, taxAmount, totalAmount, 
                dueDate: new Date(dueDate), 
                billMonth, 
                status: 'PENDING' 
            }
        });
        
        await prisma.consumer.update({ where: { id: parsedConsumerId }, data: { lastReading: parsedCurrReading } });
        res.status(201).json({ success: true, message: 'Bill generated.', data: bill });
    } catch (error) {
        console.error('generateBill Error:', error);
        res.status(500).json({ success: false, message: 'Server error: ' + error.message });
    }
};

// ─────────────────────────────────────────
// GET /api/bills/:id
// ─────────────────────────────────────────
const getBillById = async (req, res) => {
    try {
        const bill = await prisma.bill.findUnique({ where: { id: Number(req.params.id) }, include: { consumer: { include: { user: { select: { name: true } } } } } });
        if (!bill) return res.status(404).json({ success: false, message: 'Bill not found.' });
        res.status(200).json({ success: true, data: bill });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ─────────────────────────────────────────
// GET /api/dashboard/stats
// ─────────────────────────────────────────
const getDashboardStats = async (req, res) => {
    try {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const results = await Promise.all([
            prisma.consumer.count().catch(() => 0),
            prisma.meter.count({ where: { status: 'Active' } }).catch(() => 0),
            prisma.meter.count({ where: { status: { not: 'Active' } } }).catch(() => 0),
            prisma.bill.count().catch(() => 0),
            prisma.bill.aggregate({ where: { status: 'PENDING' }, _sum: { totalAmount: true } }).catch(() => ({ _sum: { totalAmount: 0 } })),
            prisma.payment.aggregate({ where: { status: 'SUCCESS' }, _sum: { amount: true } }).catch(() => ({ _sum: { amount: 0 } })),
            prisma.payment.findMany({ take: 5, orderBy: { paidAt: 'desc' }, include: { consumer: { include: { user: { select: { name: true } } } } } }).catch(() => []),
            prisma.complaint.findMany({ take: 5, where: { status: 'PENDING' }, orderBy: { createdAt: 'desc' }, include: { consumer: { include: { user: { select: { name: true } } } } } }).catch(() => []),
            prisma.payment.findMany({ where: { status: 'SUCCESS', paidAt: { gte: sixMonthsAgo } }, select: { amount: true, paidAt: true }, orderBy: { paidAt: 'asc' } }).catch(() => []),
        ]);

        const [totalConsumers, onlineMeters, offlineMeters, totalBills, pendingBills, paidPayments, recentPaymentsRaw, recentComplaintsRaw, paymentsForChart] = results;

        const monthlyRevenue = paymentsForChart.reduce((acc, p) => {
            const m = p.paidAt.toLocaleString('en-US', { month: 'short' });
            const existing = acc.find(x => x.name === m);
            if (existing) existing.revenue += p.amount;
            else acc.push({ name: m, revenue: p.amount });
            return acc;
        }, []);

        res.status(200).json({
            success: true,
            data: {
                totalConsumers, onlineMeters, offlineMeters, totalMeters: onlineMeters + offlineMeters, totalBills,
                pendingAmount: Number(pendingBills?._sum?.totalAmount || 0),
                paidAmount: Number(paidPayments?._sum?.amount || 0),
                recentPayments: recentPaymentsRaw.map(p => ({ id: p.id, consumerName: p.consumer?.user?.name || 'Unknown', amount: p.amount, paidAt: p.paidAt, status: p.status })),
                recentComplaints: recentComplaintsRaw.map(c => ({ id: c.id, consumerName: c.consumer?.user?.name || 'Unknown', type: c.type, createdAt: c.createdAt })),
                monthlyRevenue
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

module.exports = { getAllBills, getMyBills, generateBill, generateAllBills, getBillById, getDashboardStats };
