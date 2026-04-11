const prisma = require('../config/prisma');

// Get user notifications
const getMyNotifications = async (req, res) => {
    try {
        const notifications = await prisma.notification.findMany({
            where: { userId: req.user.id },
            orderBy: { createdAt: 'desc' },
        });
        res.status(200).json({ success: true, data: notifications });
    } catch (error) {
        console.error('getMyNotifications Error:', error);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// Mark notification as read
const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.notification.update({
            where: { id: Number(id) },
            data: { isRead: true },
        });
        res.status(200).json({ success: true, message: 'Notification marked as read.' });
    } catch (error) {
        console.error('markAsRead Error:', error);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// Create notification (Internal use or Admin)
const createNotification = async (userId, title, message) => {
    try {
        await prisma.notification.create({
            data: {
                userId,
                title,
                message,
            },
        });
        return true;
    } catch (error) {
        console.error('createNotification Error:', error);
        return false;
    }
};

module.exports = { getMyNotifications, markAsRead, createNotification };
