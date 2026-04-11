const express = require('express');
const {
    getAllBills,
    getMyBills,
    generateBill,
    generateAllBills,
    getBillById,
    getDashboardStats,
} = require('../controllers/bill.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

// Stats for Admin
router.get('/stats', protect, authorize('ADMIN'), getDashboardStats);

// List All Bills (Admin)
router.get('/', protect, authorize('ADMIN'), getAllBills);

// Get My Bills (Consumer)
router.get('/my', protect, authorize('CONSUMER'), getMyBills);

// Generate Bill (Admin + Operator)
router.post('/generate', protect, authorize('ADMIN', 'OPERATOR'), generateBill);

// Bulk Generate (Admin)
router.post('/generate-all', protect, authorize('ADMIN'), generateAllBills);

// Get Single Bill
router.get('/:id', protect, getBillById);

module.exports = router;
