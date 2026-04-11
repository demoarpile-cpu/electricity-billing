const express = require('express');
const {
    raiseComplaint,
    getMyComplaints,
    getAllComplaints,
    updateComplaintStatus,
} = require('../controllers/complaint.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

// Admin + Operator - List All
router.get('/', protect, authorize('ADMIN', 'OPERATOR'), getAllComplaints);

// Update/Assign (Admin + Operator)
router.patch('/:id', protect, authorize('ADMIN', 'OPERATOR'), updateComplaintStatus);

// My Complaints (Consumer)
router.get('/my', protect, authorize('CONSUMER'), getMyComplaints);
router.post('/', protect, authorize('CONSUMER'), raiseComplaint);

module.exports = router;
