const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Readable } = require('stream');
const db = require('../Db');
const { authRequired, authOptional, adminOnly } = require('../middleware/auth');
const { uploadToBlob, deleteFromBlob, blobNameFromUrl, USE_BLOB } = require('../blobStorage');

// ─── Multer setup ────────────────────────────────────────────────────────────
// Use memory storage when Blob is configured, disk otherwise
const storage = USE_BLOB
    ? multer.memoryStorage()
    : multer.diskStorage({
        destination: (req, file, cb) => {
            const uploadsPath = process.env.UPLOADS_PATH || path.join(__dirname, '..', 'uploads');
            const dir = path.join(uploadsPath, 'resources');
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            cb(null, dir);
        },
        filename: (req, file, cb) => {
            const ext = path.extname(file.originalname).toLowerCase();
            cb(null, `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`);
        }
    });

const ALLOWED_TYPES = {
    // Documents
    '.pdf': 'application/pdf',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.doc': 'application/msword',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    // Videos
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.mov': 'video/quicktime',
    '.avi': 'video/x-msvideo',
    // Images
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
};

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        if (ALLOWED_TYPES[ext]) {
            cb(null, true);
        } else {
            cb(new Error(`File type ${ext} is not allowed`), false);
        }
    },
    limits: { fileSize: 500 * 1024 * 1024 } // 500MB for videos
});

// ─── Helper: build file_path for local disk ──────────────────────────────────
function localFilePath(file) {
    const uploadsPath = process.env.UPLOADS_PATH || path.join(__dirname, '..', 'uploads');
    // Make path relative to uploads root for serving
    return `/uploads/resources/${file.filename}`;
}

// ─── GET /api/resources — list resources ─────────────────────────────────────
router.get('/', authOptional, async (req, res) => {
    try {
        const { type, access } = req.query;
        let sql = 'SELECT * FROM resources WHERE 1=1';
        const params = [];

        // Non-members only see public resources
        const canSeeMembers = req.user?.role === 'admin' ||
            req.user?.role === 'executive' ||
            req.user?.role === 'member';

        if (!canSeeMembers) {
            sql += ' AND access_level = ?';
            params.push('public');
        }

        if (type) { sql += ' AND type = ?'; params.push(type); }

        // Admin sees all statuses, others only approved
        if (req.user?.role !== 'admin' && req.user?.role !== 'executive') {
            sql += ' AND (status = ? OR status IS NULL)';
            params.push('approved');
        }

        sql += ' ORDER BY created_at DESC';

        const [rows] = await db.query(sql, params);
        res.json(rows);
    } catch (err) {
        console.error('[resources/list]', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ─── GET /api/resources/videos — only video type for homepage carousel ────────
router.get('/videos', async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT id, title, summary, file_path, source_url, thumbnail_url, created_at
             FROM resources
             WHERE type = 'video' AND access_level = 'public' AND (status = 'approved' OR status IS NULL)
             ORDER BY created_at DESC`,
            []
        );
        res.json(rows);
    } catch (err) {
        console.error('[resources/videos]', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ─── GET /api/resources/pending — pending resources for admin review ─────────
router.get('/pending', authRequired, adminOnly, async (req, res) => {
    try {
        const [rows] = await db.query(
            "SELECT * FROM resources WHERE status = 'pending' ORDER BY created_at DESC",
            []
        );
        res.json(rows);
    } catch (err) {
        console.error('[resources/pending]', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ─── GET /api/resources/:id/stream — proxy blob video to avoid CORS on range requests ──
router.get('/:id/stream', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT file_path FROM resources WHERE id = ?', [req.params.id]);
        if (!rows.length || !rows[0].file_path) return res.status(404).json({ error: 'Not found' });

        const fileUrl = rows[0].file_path;

        // Only proxy blob URLs — local files served directly
        if (!fileUrl.startsWith('http')) {
            return res.redirect(fileUrl);
        }

        const rangeHeader = req.headers['range'];
        const fetchHeaders = {};
        if (rangeHeader) fetchHeaders['Range'] = rangeHeader;

        const upstream = await fetch(fileUrl, { headers: fetchHeaders });

        if (!upstream.ok && upstream.status !== 206) {
            return res.status(upstream.status).end();
        }

        // Forward relevant headers
        const forward = ['content-type', 'content-length', 'content-range', 'accept-ranges', 'cache-control'];
        forward.forEach(h => {
            const val = upstream.headers.get(h);
            if (val) res.setHeader(h, val);
        });

        res.status(upstream.status);
        Readable.fromWeb(upstream.body).pipe(res);

    } catch (err) {
        console.error('[resources/stream]', err);
        res.status(500).json({ error: 'Stream error' });
    }
});

// ─── POST /api/resources — upload new resource ───────────────────────────────
router.post('/', authRequired, upload.single('file'), async (req, res) => {
    try {
        const { title, summary, type, access_level, source_url, category_slug, thumbnail_url } = req.body;
        if (!title || !summary) return res.status(400).json({ error: 'Title and summary are required' });

        const isAdmin = req.user.role === 'admin' || req.user.role === 'executive';
        const status = isAdmin ? 'approved' : 'pending';

        let filePath = null;
        let blobName = null;

        if (req.file) {
            if (USE_BLOB) {
                const result = await uploadToBlob(
                    req.file.buffer,
                    req.file.originalname,
                    req.file.mimetype,
                    'resources'
                );
                filePath = result.url;
                blobName = result.blobName;
            } else {
                filePath = localFilePath(req.file);
            }
        }

        const [result] = await db.query(
            `INSERT INTO resources
             (title, summary, type, access_level, source_url, category_slug, file_path, blob_name, thumbnail_url, status, user_id)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [title, summary, type || 'article', access_level || 'public',
             source_url || null, category_slug || null,
             filePath, blobName || null,
             thumbnail_url || null, status, req.user.id]
        );

        res.status(201).json({
            id: result.insertId, title, summary, type: type || 'article',
            access_level: access_level || 'public', file_path: filePath,
            source_url: source_url || null, status
        });
    } catch (err) {
        console.error('[resources/create]', err);
        res.status(500).json({ error: err.message || 'Server error' });
    }
});

// ─── PUT /api/resources/:id — update resource (admin only) ───────────────────
router.put('/:id', authRequired, adminOnly, upload.single('file'), async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM resources WHERE id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Resource not found' });
        const existing = rows[0];

        const { title, summary, type, access_level, source_url, category_slug, thumbnail_url } = req.body;

        let filePath = existing.file_path;
        let blobName = existing.blob_name;

        if (req.file) {
            // Delete old blob if exists
            if (existing.blob_name) await deleteFromBlob(existing.blob_name);

            if (USE_BLOB) {
                const result = await uploadToBlob(
                    req.file.buffer,
                    req.file.originalname,
                    req.file.mimetype,
                    'resources'
                );
                filePath = result.url;
                blobName = result.blobName;
            } else {
                // Delete old local file
                if (existing.file_path && !existing.file_path.startsWith('http')) {
                    const oldPath = path.join(
                        process.env.UPLOADS_PATH || path.join(__dirname, '..', 'uploads'),
                        existing.file_path.replace('/uploads/', '')
                    );
                    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
                }
                filePath = localFilePath(req.file);
                blobName = null;
            }
        }

        await db.query(
            `UPDATE resources SET title=?, summary=?, type=?, access_level=?,
             source_url=?, category_slug=?, file_path=?, blob_name=?, thumbnail_url=?
             WHERE id=?`,
            [title, summary, type, access_level,
             source_url || null, category_slug || null,
             filePath, blobName || null,
             thumbnail_url || null, req.params.id]
        );

        const [updated] = await db.query('SELECT * FROM resources WHERE id = ?', [req.params.id]);
        res.json(updated[0]);
    } catch (err) {
        console.error('[resources/update]', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ─── DELETE /api/resources/:id ───────────────────────────────────────────────
router.delete('/:id', authRequired, adminOnly, async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM resources WHERE id = ?', [req.params.id]);
        if (rows.length > 0) {
            const r = rows[0];
            if (r.blob_name) {
                await deleteFromBlob(r.blob_name);
            } else if (r.file_path && !r.file_path.startsWith('http')) {
                const localPath = path.join(
                    process.env.UPLOADS_PATH || path.join(__dirname, '..', 'uploads'),
                    r.file_path.replace('/uploads/', '')
                );
                if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
            }
        }
        await db.query('DELETE FROM resources WHERE id = ?', [req.params.id]);
        res.json({ message: 'Resource deleted' });
    } catch (err) {
        console.error('[resources/delete]', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ─── PATCH /api/resources/:id/approve ────────────────────────────────────────
router.patch('/:id/approve', authRequired, adminOnly, async (req, res) => {
    try {
        await db.query("UPDATE resources SET status = 'approved' WHERE id = ?", [req.params.id]);
        res.json({ message: 'Resource approved' });
    } catch (err) {
        console.error('[resources/approve]', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ─── PATCH /api/resources/:id/reject ─────────────────────────────────────────
router.patch('/:id/reject', authRequired, adminOnly, async (req, res) => {
    try {
        await db.query("UPDATE resources SET status = 'rejected' WHERE id = ?", [req.params.id]);
        res.json({ message: 'Resource rejected' });
    } catch (err) {
        console.error('[resources/reject]', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ─── POST /api/resources/:id/download — increment download count ─────────────
router.post('/:id/download', authOptional, async (req, res) => {
    try {
        await db.query('UPDATE resources SET download_count = download_count + 1 WHERE id = ?', [req.params.id]);
        res.json({ ok: true });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;