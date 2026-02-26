const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../Db');
const { authRequired, adminOnly } = require('../middleware/auth');
const { uploadToBlob, deleteFromBlob, USE_BLOB } = require('../blobStorage');

// ── Multer ────────────────────────────────────────────────────────────────────
const storage = USE_BLOB
    ? multer.memoryStorage()
    : multer.diskStorage({
        destination: (req, file, cb) => {
            const dir = path.join(
                process.env.UPLOADS_PATH || path.join(__dirname, '..', 'uploads')
            );
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            cb(null, dir);
        },
        filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
            cb(null, 'team-' + uniqueSuffix + path.extname(file.originalname));
        }
    });

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
        const ext = path.extname(file.originalname).toLowerCase();
        cb(allowed.includes(ext) ? null : new Error('Only image files allowed'), allowed.includes(ext));
    },
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// GET /api/team
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM team_members ORDER BY id ASC');
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error fetching team members' });
    }
});

// POST /api/team
router.post('/', authRequired, adminOnly, upload.single('image'), async (req, res) => {
    const { name, role, description, linkedin_url } = req.body;
    if (!name || !role) return res.status(400).json({ error: 'Name and role are required' });

    let imageUrl = '';
    let blobName = null;

    try {
        if (req.file) {
            if (USE_BLOB) {
                // Uploads to images/team/ folder in blob
                const result = await uploadToBlob(
                    req.file.buffer,
                    req.file.originalname,
                    req.file.mimetype,
                    'team'   // → images/team/
                );
                imageUrl = result.url;
                blobName = result.blobName;
            } else {
                imageUrl = `/uploads/${req.file.filename}`;
            }
        }

        const [result] = await db.query(
            'INSERT INTO team_members (name, role, description, linkedin_url, image_url, blob_name, categories) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [name, role, description || '', linkedin_url || '', imageUrl, blobName, req.body.categories || '["leadership"]']
        );

        res.status(201).json({
            id: result.insertId, name, role, description,
            linkedin_url, image_url: imageUrl,
            categories: req.body.categories || '["leadership"]'
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error creating team member' });
    }
});

// PUT /api/team/:id
router.put('/:id', authRequired, adminOnly, upload.single('image'), async (req, res) => {
    const { name, role, description, linkedin_url } = req.body;

    try {
        const [existing] = await db.query('SELECT * FROM team_members WHERE id = ?', [req.params.id]);

        let imageUrl = req.body.image_url || (existing[0]?.image_url || '');
        let blobName = existing[0]?.blob_name || null;

        if (req.file) {
            // Delete old blob image if exists
            if (existing[0]?.blob_name) await deleteFromBlob(existing[0].blob_name);

            if (USE_BLOB) {
                const result = await uploadToBlob(
                    req.file.buffer,
                    req.file.originalname,
                    req.file.mimetype,
                    'team'
                );
                imageUrl = result.url;
                blobName = result.blobName;
            } else {
                if (existing[0]?.image_url && !existing[0].image_url.startsWith('http')) {
                    const uploadsPath = process.env.UPLOADS_PATH || path.join(__dirname, '..', 'uploads');
                    const oldPath = path.join(uploadsPath, existing[0].image_url.replace('/uploads/', ''));
                    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
                }
                imageUrl = `/uploads/${req.file.filename}`;
                blobName = null;
            }
        }

        await db.query(
            'UPDATE team_members SET name=?, role=?, description=?, linkedin_url=?, image_url=?, blob_name=?, categories=? WHERE id=?',
            [name, role, description || '', linkedin_url || '', imageUrl, blobName, req.body.categories || '["leadership"]', req.params.id]
        );

        res.json({ message: 'Team member updated', image_url: imageUrl });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error updating team member' });
    }
});

// DELETE /api/team/:id
router.delete('/:id', authRequired, adminOnly, async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM team_members WHERE id = ?', [req.params.id]);
        if (rows.length > 0) {
            if (rows[0].blob_name) {
                await deleteFromBlob(rows[0].blob_name);
            } else if (rows[0].image_url && !rows[0].image_url.startsWith('http')) {
                const uploadsPath = process.env.UPLOADS_PATH || path.join(__dirname, '..', 'uploads');
                const localPath = path.join(uploadsPath, rows[0].image_url.replace('/uploads/', ''));
                if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
            }
        }
        await db.query('DELETE FROM team_members WHERE id = ?', [req.params.id]);
        res.json({ message: 'Team member deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error deleting team member' });
    }
});

module.exports = router;