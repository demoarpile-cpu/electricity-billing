const express = require('express');
const {
    processPayment,
    getMyPayments,
    getAllPayments,
    recordManualPayment,
} = require('../controllers/payment.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

// Admin Only
router.get('/', protect, authorize('ADMIN', 'OPERATOR'), getAllPayments);
router.post('/manual', protect, authorize('ADMIN', 'OPERATOR'), recordManualPayment);

// My Payments (Consumer)
router.get('/my', protect, authorize('CONSUMER'), getMyPayments);

// Process Payment (Consumer)
router.post('/', protect, authorize('CONSUMER'), processPayment);

module.exports = router;
