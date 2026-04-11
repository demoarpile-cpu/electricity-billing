const express = require('express');
const router = express.Router();
const { getMyNotifications, markAsRead } = require('../controllers/notification.controller');
const { protect } = require('../middleware/auth.middleware');

router.get('/my', protect, getMyNotifications);
router.patch('/:id/read', protect, markAsRead);

module.exports = router;
