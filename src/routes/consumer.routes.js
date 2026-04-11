const express = require('express');
const {
    getAllConsumers,
    getConsumerById,
    createConsumer,
    updateConsumer,
    deleteConsumer,
    getMyProfile,
    updateMyProfile,
    getLatestReading,
} = require('../controllers/consumer.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

// Admin Only
router.get('/', protect, authorize('ADMIN', 'OPERATOR'), getAllConsumers);
router.post('/', protect, authorize('ADMIN'), createConsumer);

// Admin + Operator
router.get('/:id', protect, authorize('ADMIN', 'OPERATOR'), getConsumerById);
router.get('/:id/latest-reading', protect, authorize('ADMIN', 'OPERATOR'), getLatestReading);
router.put('/:id', protect, authorize('ADMIN'), updateConsumer);
router.delete('/:id', protect, authorize('ADMIN'), deleteConsumer);

// Personal profile (Consumer)
router.get('/profile/me', protect, getMyProfile);
router.put('/profile/me', protect, updateMyProfile);

module.exports = router;
