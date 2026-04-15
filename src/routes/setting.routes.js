const express = require('express');
const router = express.Router();
const { 
    getSettings, 
    updateSettings, 
    getTeam, 
    addTeamMember, 
    removeTeamMember, 
    getGlobalConfig 
} = require('../controllers/setting.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// Routes
router.get('/', protect, authorize('ADMIN'), getSettings);
router.put('/', protect, authorize('ADMIN'), updateSettings);
router.get('/team', protect, authorize('ADMIN'), getTeam);
router.post('/team', protect, authorize('ADMIN'), addTeamMember);
router.delete('/team/:id', protect, authorize('ADMIN'), removeTeamMember);

// Public for Agents
router.get('/global-config', getGlobalConfig);

module.exports = router;
