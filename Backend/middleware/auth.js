const jwt = require('jsonwebtoken');
require('dotenv').config();

// ─── JWT Secret ───────────────────────────────────────────────────────────────
// Always read from environment. Falls back to a default ONLY for development.
// In production, JWT_SECRET MUST be set as an environment variable / Azure App Setting.
const JWT_SECRET = process.env.JWT_SECRET || 'airiskcouncil-change-this-to-a-long-random-secret-before-production';

if (!process.env.JWT_SECRET) {
    console.warn('[AUTH] WARNING: JWT_SECRET is not set in environment. Using insecure default. Set it in .env or Azure App Settings.');
}

// ─── Middleware: Require valid JWT ────────────────────────────────────────────
// Returns 401 if token is missing or invalid.
const authRequired = (req, res, next) => {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    const token = header.split(' ')[1];
    try {
        req.user = jwt.verify(token, JWT_SECRET);
        next();
    } catch {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};

// ─── Middleware: Optional JWT ─────────────────────────────────────────────────
// Attaches req.user if token is present and valid, continues either way.
const authOptional = (req, res, next) => {
    const header = req.headers.authorization;
    if (header && header.startsWith('Bearer ')) {
        const token = header.split(' ')[1];
        try {
            req.user = jwt.verify(token, JWT_SECRET);
        } catch {
            req.user = null;
        }
    }
    next();
};

// ─── Middleware: Admin only ───────────────────────────────────────────────────
// Use AFTER authRequired. Allows both 'admin' and 'executive' roles.
const adminOnly = (req, res, next) => {
    if (req.user?.role !== 'admin' && req.user?.role !== 'executive') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};

module.exports = { JWT_SECRET, authRequired, authOptional, adminOnly };