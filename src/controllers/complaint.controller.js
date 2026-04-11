const prisma = require('../config/prisma');

// Internal notification creator
const triggerNotification = async (userId, title, message) => {
    try {
        await prisma.notification.create({
            data: { userId, title, message }
        });
    } catch (error) {
        console.warn('Notification trigger failed:', error.message);
    }
};

// ─────────────────────────────────────────
// POST /api/complaints  (Consumer - raise)
// ─────────────────────────────────────────
const raiseComplaint = async (req, res) => {
    try {
        const { type, subject, description } = req.body;
        const userId = req.user.id;

        if (!type || !subject || !description) {
            return res.status(400).json({ success: false, message: 'Type, subject, and description are required.' });
        }

        const consumer = await prisma.consumer.findUnique({ where: { userId } });
        if (!consumer) return res.status(404).json({ success: false, message: 'Consumer profile not found.' });

        const complaint = await prisma.complaint.create({
            data: {
                consumer: { connect: { id: consumer.id } },
                type,
                subject,
                description,
                status: 'PENDING',
            },
        });

        // Trigger Notification
        await triggerNotification(
            userId,
            'Complaint Raised 📢',
            `Your complaint regarding "${subject}" has been registered successfully. Ref: #${complaint.complaintNumber.slice(0, 8).toUpperCase()}.`
        );

        res.status(201).json({
            success: true,
            message: 'Complaint raised successfully.',
            data: complaint,
        });
    } catch (error) {
        console.error('raiseComplaint Error:', error);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ─────────────────────────────────────────
// GET /api/complaints/my  (Consumer - own list)
// ─────────────────────────────────────────
const getMyComplaints = async (req, res) => {
    try {
        const consumer = await prisma.consumer.findUnique({ where: { userId: req.user.id } });
        if (!consumer) return res.status(404).json({ success: false, message: 'Consumer profile not found.' });

        const complaints = await prisma.complaint.findMany({
            where: { consumerId: consumer.id },
            orderBy: { createdAt: 'desc' },
        });

        res.status(200).json({ success: true, data: complaints });
    } catch (error) {
        console.error('getMyComplaints Error:', error);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ─────────────────────────────────────────
// GET /api/complaints  (Admin + Operator)
// ─────────────────────────────────────────
const getAllComplaints = async (req, res) => {
    try {
        const { status } = req.query;
        const where = {};
        if (status && status !== 'All') where.status = status.toUpperCase();

        const complaints = await prisma.complaint.findMany({
            where,
            include: {
                consumer: {
                    include: {
                        user: { select: { name: true } }
                    }
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        const formatted = complaints.map((c) => ({
            id: c.id,
            complaintNumber: c.complaintNumber,
            consumerName: c.consumer?.user?.name || 'Unknown Consumer',
            type: c.type,
            subject: c.subject,
            description: c.description,
            status: c.status,
            assignedTo: c.assignedTo || 'Unassigned',
            createdAt: c.createdAt,
            resolvedAt: c.resolvedAt
        }));

        res.status(200).json({ success: true, data: formatted });
    } catch (error) {
        console.error('getAllComplaints Error:', error);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ─────────────────────────────────────────
// PATCH /api/complaints/:id  (Admin + Operator - update status/assign)
// ─────────────────────────────────────────
const updateComplaintStatus = async (req, res) => {
    try {
        const { status, assignedTo } = req.body;
        const complaintId = Number(req.params.id);

        const updateData = {};
        if (status) updateData.status = status.toUpperCase();
        if (assignedTo) updateData.assignedTo = assignedTo;
        if (status === 'RESOLVED') updateData.resolvedAt = new Date();

        const updated = await prisma.complaint.update({
            where: { id: complaintId },
            data: updateData,
            include: { consumer: true }
        });

        // Trigger Notification
        if (status && updated.consumer) {
            await triggerNotification(
                updated.consumer.userId,
                `Complaint Update: ${status.replace(/_/g, ' ')} 📋`,
                `The status of your complaint #${updated.complaintNumber.slice(0, 8).toUpperCase()} has been updated to ${status.replace(/_/g, ' ')}.`
            );
        }

        res.status(200).json({
            success: true,
            message: 'Complaint updated successfully.',
            data: updated,
        });
    } catch (error) {
        console.error('updateComplaintStatus Error:', error);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

module.exports = {
    raiseComplaint,
    getMyComplaints,
    getAllComplaints,
    updateComplaintStatus,
};
