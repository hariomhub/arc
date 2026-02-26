const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const isProd = process.env.NODE_ENV === 'production';

// ─── Uploads Path ────────────────────────────────────────────────────────────
// Dev:  ./uploads  (next to server.js)
// Prod: /home/site/uploads  (Azure persistent storage)
const uploadsPath = process.env.UPLOADS_PATH
    ? path.resolve(process.env.UPLOADS_PATH)
    : (isProd ? '/home/site/uploads' : path.join(__dirname, 'uploads'));

if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, { recursive: true });
    console.log(`Created uploads directory: ${uploadsPath}`);
}

// Export so route files can use it
app.set('uploadsPath', uploadsPath);

// ─── Security / Helmet ───────────────────────────────────────────────────────
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "data:", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "blob:", "https://randomuser.me", "https://img.youtube.com", "https://airiskcouncilstorage.blob.core.windows.net"],
            mediaSrc: ["'self'", "blob:", "https://airiskcouncilstorage.blob.core.windows.net"],
            frameSrc: ["https://www.youtube.com", "https://youtube.com"],
            connectSrc: ["'self'", "https://airiskcouncilstorage.blob.core.windows.net"],
            objectSrc: ["'none'"],
            ...(isProd && { upgradeInsecureRequests: [] })
        }
    }
}));

// ─── CORS ────────────────────────────────────────────────────────────────────
// Production: same domain, CORS not needed
// Development: allow Vite dev server
app.use(cors({
    origin: isProd
        ? false
        : ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true
}));

// ─── Rate Limiting ───────────────────────────────────────────────────────────
// Trust the Azure proxy to reliably get the client IP address
app.set('trust proxy', 1);

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' },
    keyGenerator: (req) => {
        const ip = req.ip || req.socket.remoteAddress || '';
        // Azure proxy sometimes sends IP:port — strip the port
        return ip.replace(/:\d+$/, '').replace(/^::ffff:/, '');
    }
});
app.use('/api', limiter);

// ─── Body Parsing ────────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ─── Static: Uploads ─────────────────────────────────────────────────────────
app.use('/uploads', express.static(uploadsPath));

// ─── API Routes ──────────────────────────────────────────────────────────────
app.use('/api/admin', require('./routes/admin'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/events', require('./routes/events'));
app.use('/api/team', require('./routes/team'));
app.use('/api/resources', require('./routes/resources'));
app.use('/api/questions', require('./routes/questions'));
app.use('/api/answers', require('./routes/answers'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/users', require('./routes/users'));
app.use('/api/products', require('./routes/products'));
app.use('/api/playbooks', require('./routes/playbooks'));

// Health check
app.get('/api/health', (_, res) => res.json({
    status: 'ok',
    env: process.env.NODE_ENV || 'development',
    uploadsPath,
    dbPath: process.env.SQLITE_DB_PATH || 'default'
}));

// ─── Frontend (Vite build) ───────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ─── Global Error Handler ────────────────────────────────────────────────────
// MUST be last. MUST have exactly 4 arguments (err, req, res, next).
// Without this, any thrown error returns HTML, which causes
// "Unexpected end of JSON input" on the frontend.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    console.error('[Global Error]', err.stack || err.message);

    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ error: 'File too large' });
    }
    if (err.type === 'entity.too.large') {
        return res.status(413).json({ error: 'Request body too large' });
    }
    if (err.message && (err.message.includes('Only PDF') || err.message.includes('Only'))) {
        return res.status(400).json({ error: err.message });
    }

    res.status(err.status || 500).json({
        error: isProd
            ? 'Internal server error'
            : (err.message || 'Internal server error')
    });
});

// ─── Auto-migrate: add missing columns on existing databases ─────────────────
const db = require('./Db');
(async () => {
    try {
        await db.query('ALTER TABLE team_members ADD COLUMN blob_name TEXT');
        console.log('[Migration] Added blob_name column to team_members');
    } catch (_) { /* column already exists — safe to ignore */ }
})();

// ─── Start ───────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
    console.log(`Uploads path: ${uploadsPath}`);
    console.log(`DB path: ${process.env.SQLITE_DB_PATH || './database.sqlite (default)'}`);
});