const router = require('express').Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../Db');
const { JWT_SECRET, authRequired } = require('../middleware/auth');

// POST /api/auth/register
router.post('/register', async (req, res) => {
    const { name, email, password, role, organization_name, gst, pan, incorporation_number, phone } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ error: 'Name, email, and password required' });
    }

    try {
        const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(409).json({ error: 'Email already registered' });
        }

        const password_hash = await bcrypt.hash(password, 12);
        const assignedRole = ['user', 'university', 'company'].includes(role) ? role : 'user';

        const [result] = await db.query(
            `INSERT INTO users (name, email, password_hash, role, organization_name, gst, pan, incorporation_number, phone)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [name, email, password_hash, assignedRole,
             organization_name || null, gst || null, pan || null,
             incorporation_number || null, phone || null]
        );

        const newUser = { id: result.insertId, name, email, role: assignedRole, approval_status: 'pending' };
        const token = jwt.sign(newUser, JWT_SECRET, { expiresIn: '7d' });
        res.status(201).json({ token, user: newUser });
    } catch (err) {
        console.error('[auth/register]', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
    }

    try {
        const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = rows[0];

        if (user.is_banned) {
            return res.status(403).json({ error: 'Account is banned' });
        }

        // Guard against guest accounts (empty password_hash)
        if (!user.password_hash || user.password_hash === '$GUEST$NO_LOGIN_POSSIBLE$') {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const payload = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            approval_status: user.approval_status
        };
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

        res.json({
            token,
            user: payload
        });
    } catch (err) {
        console.error('[auth/login]', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/auth/me — verify token and return fresh user data
router.get('/me', authRequired, async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT id, name, email, role, approval_status, organization_name, created_at FROM users WHERE id = ?',
            [req.user.id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(rows[0]);
    } catch (err) {
        console.error('[auth/me]', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });

    try {
        const [rows] = await db.query('SELECT id FROM users WHERE email = ?', [email]);

        // Always return 200 to prevent email enumeration
        if (rows.length === 0) {
            return res.json({ message: 'If that email exists, a reset link was sent.' });
        }

        const token = crypto.randomBytes(32).toString('hex');
        const expires = new Date(Date.now() + 3600 * 1000).toISOString(); // 1 hour, ISO string for SQLite

        await db.query(
            'UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE email = ?',
            [token, expires, email]
        );

        const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password?token=${token}`;
        // TODO: Send email. For now, log the link.
        console.log(`[auth/forgot-password] Reset link for ${email}: ${resetUrl}`);

        res.json({ message: 'If that email exists, a reset link was sent.' });
    } catch (err) {
        console.error('[auth/forgot-password]', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
    const { token, password } = req.body;
    if (!token || !password) {
        return res.status(400).json({ error: 'Token and new password required' });
    }

    try {
        // SQLite-compatible datetime comparison (was NOW() which is MySQL-only)
        const [rows] = await db.query(
            "SELECT id FROM users WHERE reset_token = ? AND reset_token_expires > datetime('now')",
            [token]
        );

        if (rows.length === 0) {
            return res.status(400).json({ error: 'Invalid or expired reset token' });
        }

        const password_hash = await bcrypt.hash(password, 12);
        await db.query(
            'UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?',
            [password_hash, rows[0].id]
        );

        res.json({ message: 'Password reset successfully' });
    } catch (err) {
        console.error('[auth/reset-password]', err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;