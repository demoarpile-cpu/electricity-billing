const prisma = require('../config/prisma');
const bcrypt = require('bcryptjs');

// ─────────────────────────────────────────
// GET /api/settings
// ─────────────────────────────────────────
const getSettings = async (req, res) => {
    try {
        console.log('--- GET /api/settings ---');
        let settings = await prisma.systemSetting.findUnique({ where: { id: 1 } });

        // If no settings exist, create default
        if (!settings) {
            console.log('⚠️ No settings found, creating default Record #1...');
            settings = await prisma.systemSetting.create({
                data: {
                    id: 1, // Explicit ID for System Settings
                    residentialRate: 6,
                    commercialRate: 8,
                    industrialRate: 12,
                    taxPercent: 5,
                    maintenanceMode: false,
                    gatewayIp: "192.168.1.100",
                    gatewayPort: 502,
                    baudRate: 9600,
                    pollingInterval: 15
                }
            });
            console.log('✅ Default Settings Initialized.');
        }

        res.status(200).json({ success: true, data: settings });
    } catch (error) {
        console.error('💥 getSettings Error:', error.message);
        res.status(500).json({ 
            success: false, 
            message: 'Server error: ' + error.message,
            hint: 'Ensure database table system_settings is correctly setup.'
        });
    }
};

// ─────────────────────────────────────────
// PUT /api/settings
// ─────────────────────────────────────────
const updateSettings = async (req, res) => {
    try {
        const settings = await prisma.systemSetting.update({
            where: { id: 1 },
            data: req.body
        });
        res.status(200).json({ success: true, data: settings, message: 'Settings updated successfully' });
    } catch (error) {
        console.error('💥 updateSettings Error:', error.message);
        res.status(500).json({ success: false, message: 'Server error: ' + error.message });
    }
};

// ─────────────────────────────────────────
// GET /api/settings/team
// ─────────────────────────────────────────
const getTeam = async (req, res) => {
    try {
        const members = await prisma.user.findMany({
            where: { role: { in: ['ADMIN', 'OPERATOR'] } },
            select: { id: true, name: true, email: true, role: true, createdAt: true }
        });
        res.status(200).json({ success: true, data: members });
    } catch (error) {
        console.error('💥 getTeam Error:', error.message);
        res.status(500).json({ success: false, message: 'Server error: ' + error.message });
    }
};

// ─────────────────────────────────────────
// POST /api/settings/team
// ─────────────────────────────────────────
const addTeamMember = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        
        const normalizedEmail = email.toLowerCase().trim();
        const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
        if (existing) return res.status(400).json({ success: false, message: 'Email already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);
        
        const user = await prisma.user.create({
            data: { 
                name, 
                email: normalizedEmail, 
                password: hashedPassword, 
                role: role.toUpperCase(),
                ...(role.toUpperCase() === 'OPERATOR' && { operator: { create: {} } })
            }
        });

        res.status(201).json({ success: true, message: 'Team member added successfully', data: user });
    } catch (error) {
        console.error('💥 addTeamMember Error:', error);
        if (error.code === 'P2002') return res.status(400).json({ success: false, message: 'Email is already registered.' });
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};

// ─────────────────────────────────────────
// DELETE /api/settings/team/:id
// ─────────────────────────────────────────
const removeTeamMember = async (req, res) => {
    try {
        const { id } = req.params;
        if (Number(id) === req.user.id) return res.status(400).json({ success: false, message: 'Cannot remove yourself' });

        await prisma.user.delete({ where: { id: Number(id) } });
        res.status(200).json({ success: true, message: 'Member removed successfully' });
    } catch (error) {
        console.error('💥 removeTeamMember Error:', error.message);
        res.status(500).json({ success: false, message: 'Server error: ' + error.message });
    }
};

// ─────────────────────────────────────────
// GET /api/settings/global-config (Public for Agents)
// ─────────────────────────────────────────
const getGlobalConfig = async (req, res) => {
    try {
        const settings = await prisma.systemSetting.findUnique({ where: { id: 1 } });
        res.status(200).json({ success: true, data: settings });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getSettings, updateSettings, getTeam, addTeamMember, removeTeamMember, getGlobalConfig };
