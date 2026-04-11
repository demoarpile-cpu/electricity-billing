const prisma = require('../config/prisma');

const getConsumptionReport = async (req, res) => {
    try {
        const { meterId, startDate, endDate } = req.query;
        
        const where = {};
        if (meterId) where.meterId = Number(meterId);
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = new Date(startDate);
            if (endDate) where.createdAt.lte = new Date(endDate);
        }

        const readings = await prisma.meterReading.findMany({
            where,
            orderBy: { createdAt: 'asc' },
            include: {
                meter: {
                    select: {
                        meterId: true,
                        meterName: true,
                        consumer: {
                            include: {
                                user: { select: { name: true } }
                            }
                        }
                    }
                }
            }
        });

        // Group by day for the chart
        const dailyConsumption = {};
        readings.forEach(r => {
            const date = r.createdAt.toISOString().split('T')[0];
            if (!dailyConsumption[date]) {
                dailyConsumption[date] = { energy: 0, count: 0 };
            }
            // For energy, we usually want the difference between max and min of the day, 
            // but for a simple "log" we can just show the values.
            // Let's store the raw readings for now.
        });

        res.status(200).json({ success: true, data: readings });
    } catch (error) {
        console.error('getConsumptionReport Error:', error);
        res.status(500).json({ success: false, message: 'Server error: ' + error.message });
    }
};

const getMeterLogs = async (req, res) => {
    try {
        const logs = await prisma.meterReading.findMany({
            take: 100,
            orderBy: { createdAt: 'desc' },
            include: {
                meter: {
                    select: {
                        meterId: true,
                        meterName: true
                    }
                }
            }
        });
        res.status(200).json({ success: true, data: logs });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports = {
    getConsumptionReport,
    getMeterLogs
};
