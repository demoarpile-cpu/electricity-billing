const express = require('express');
const { getSettings, updateSettings, getTeam, addTeamMember, removeTeamMember } = require('../controllers/setting.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

// Settings manage
router.get('/', protect, authorize('ADMIN'), getSettings);
router.put('/', protect, authorize('ADMIN'), updateSettings);

// Team manage
router.get('/team', protect, authorize('ADMIN'), getTeam);
router.post('/team', protect, authorize('ADMIN'), addTeamMember);
router.delete('/team/:id', protect, authorize('ADMIN'), removeTeamMember);

// @desc    Get global config for agents
// @route   GET /api/settings/global-config
router.get('/global-config', settingController.getGlobalConfig);

module.exports = router;
