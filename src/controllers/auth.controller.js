const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');

// Helper to sign JWT
const signToken = (payload) =>
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// ─────────────────────────────────────────
// POST /api/auth/login
// ─────────────────────────────────────────
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required.' });
        }

        const normalizedEmail = email.toLowerCase().trim();
        console.log('🔍 Login attempt for:', normalizedEmail);

        const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

        if (!user) {
            console.log('❌ User not found:', normalizedEmail);
            return res.status(401).json({ success: false, message: 'Invalid credentials.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.log('❌ Password mismatch for:', normalizedEmail);
            return res.status(401).json({ success: false, message: 'Invalid credentials.' });
        }

        console.log('✅ Login successful for:', normalizedEmail, 'Role:', user.role);

        const token = signToken({ id: user.id, role: user.role, email: user.email });

        // Get consumer profile if role is CONSUMER
        let profile = null;
        if (user.role === 'CONSUMER') {
            profile = await prisma.consumer.findUnique({ where: { userId: user.id } });
        }

        res.status(200).json({
            success: true,
            message: 'Login successful.',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role.toLowerCase(),
                consumerId: profile?.id || null,
            },
        });
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ─────────────────────────────────────────
// GET /api/auth/me   (Protected)
// ─────────────────────────────────────────
const getMe = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: { id: true, name: true, email: true, role: true, createdAt: true },
        });
        if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

        res.status(200).json({
            success: true,
            user: {
                ...user,
                role: user.role.toLowerCase()
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ─────────────────────────────────────────
// PUT /api/auth/profile   (Protected)
// ─────────────────────────────────────────
const updateProfile = async (req, res) => {
    try {
        const { name, email, phoneNumber, password } = req.body;
        const updateData = {};

        if (name) updateData.name = name;
        if (email) updateData.email = email.toLowerCase().trim();
        if (phoneNumber) updateData.phoneNumber = phoneNumber;

        if (password) {
            const salt = await bcrypt.genSalt(10);
            updateData.password = await bcrypt.hash(password, salt);
        }

        const user = await prisma.user.update({
            where: { id: req.user.id },
            data: updateData,
            select: { id: true, name: true, email: true, role: true, phoneNumber: true }
        });

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully.',
            user
        });
    } catch (error) {
        console.error('💥 updateProfile Error:', error);
        if (error.code === 'P2002') return res.status(400).json({ success: false, message: 'Email is already taken.' });
        res.status(500).json({ success: false, message: 'Failed to update profile.' });
    }
};

module.exports = { login, getMe, updateProfile };
