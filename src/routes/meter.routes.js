const express = require('express');
const router = express.Router();
const meterController = require('../controllers/meter.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// @desc    Get all meters
// @route   GET /api/meters
router.get('/', protect, authorize('ADMIN', 'OPERATOR'), meterController.getAllMeters);

// @desc    Save or Update Meter Config with Hardware Verification
// @route   POST /api/meters/save-meter-config
router.post('/save-meter-config', protect, authorize('ADMIN'), meterController.upsertMeter);

// @desc    Test connection without saving
// @route   POST /api/meters/test-connection
router.post('/test-connection', protect, authorize('ADMIN', 'OPERATOR'), meterController.testConnection);

// @desc    Get real-time status of a specific meter
// @route   GET /api/meters/status/:id
router.get('/status/:id', protect, authorize('ADMIN', 'OPERATOR'), meterController.getMeterStatus);

// @desc    Delete a meter
// @route   DELETE /api/meters/:id
router.delete('/:id', protect, authorize('ADMIN'), meterController.deleteMeter);

// @desc    Live data for dashboard
// @route   GET /api/meters/live
router.get('/live', protect, authorize('ADMIN', 'OPERATOR'), meterController.getLiveDashboardData);

// @desc    Update register mapping
// @route   PUT /api/meters/:id/registers
router.put('/:id/registers', protect, authorize('ADMIN'), meterController.updateRegisters);

// @desc    Receive telemetry from Edge Agent
// @route   POST /api/meters/meter-data
router.post('/meter-data', meterController.receiveAgentData);

// @desc    Agent Heartbeat
// @route   POST /api/meters/agent-heartbeat
router.post('/agent-heartbeat', meterController.agentHeartbeat);

// @desc    Auto-register discovered meter from Agent
// @route   POST /api/meters/auto-register
router.post('/auto-register', meterController.autoRegisterMeter);

module.exports = router;
