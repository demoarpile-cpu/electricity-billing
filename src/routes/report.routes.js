const express = require('express');
const router = express.Router();
const controller = require('../controllers/report.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.get('/consumption', protect, authorize('ADMIN'), controller.getConsumptionReport);
router.get('/logs', protect, authorize('ADMIN'), controller.getMeterLogs);

module.exports = router;
