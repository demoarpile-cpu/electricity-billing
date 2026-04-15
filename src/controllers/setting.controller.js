const prisma = require('../config/prisma');
const bcrypt = require('bcryptjs');

const getSettings = async (req, res) => {
    try {
        let settings = await prisma.systemSetting.findUnique({ where: { id: 1 } });
        if (!settings) {
            settings = await prisma.systemSetting.create({
                data: {
                    id: 1,
                    residentialRate: 6,
                    commercialRate: 8,
                    industrialRate: 12,
                    taxPercent: 5,
                    gatewayIp: "PB-SECURE-KEY-888",
                    gatewayPort: 502,
                    baudRate: 9600,
                    pollingInterval: 15
                }
            });
        }
        res.status(200).json({ success: true, data: settings });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const updateSettings = async (req, res) => {
    try {
        const settings = await prisma.systemSetting.update({
            where: { id: 1 },
            data: req.body
        });
        res.status(200).json({ success: true, data: settings });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getTeam = async (req, res) => {
    try {
        const members = await prisma.user.findMany({
            where: { role: { in: ['ADMIN', 'OPERATOR'] } },
            select: { id: true, name: true, email: true, role: true }
        });
        res.status(200).json({ success: true, data: members });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const addTeamMember = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: { name, email: email.toLowerCase(), password: hashedPassword, role: role.toUpperCase() }
        });
        res.status(201).json({ success: true, data: user });
    } catch (error) {
        res.status(400).json({ success: false, message: 'User already exists' });
    }
};

const removeTeamMember = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.user.delete({ where: { id: Number(id) } });
        res.status(200).json({ success: true, message: 'Removed' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getGlobalConfig = async (req, res) => {
    try {
        const settings = await prisma.systemSetting.findUnique({ where: { id: 1 } });
        res.status(200).json({ success: true, data: settings });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { 
    getSettings, 
    updateSettings, 
    getTeam, 
    addTeamMember, 
    removeTeamMember, 
    getGlobalConfig 
};
