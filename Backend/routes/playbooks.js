const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../Db');
const { authRequired, adminOnly } = require('../middleware/auth');
const { uploadToBlob, deleteFromBlob, USE_BLOB } = require('../blobStorage');

// ── Multer: memory for blob, disk for local ───────────────────────────────────
const uploadDir = USE_BLOB
    ? null
    : (() => {
        const dir = path.join(
            process.env.UPLOADS_PATH || path.join(__dirname, '..', 'uploads'),
            'playbooks'
        );
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        return dir;
    })();

const storage = USE_BLOB
    ? multer.memoryStorage()
    : multer.diskStorage({
        destination: (req, file, cb) => cb(null, uploadDir),
        filename: (req, file, cb) =>
            cb(null, `${Date.now()}_${file.originalname.replace(/\s+/g, '_')}`)
    });

const ALLOWED = ['.pdf', '.xlsx', '.xls', '.docx', '.doc', '.pptx', '.ppt'];

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        cb(ALLOWED.includes(ext) ? null : new Error(`File type ${ext} not allowed`), ALLOWED.includes(ext));
    },
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

// GET /api/playbooks
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT id, title, brief, framework, category, file_type, file_name, download_count, created_at FROM playbooks ORDER BY created_at DESC'
        );
        res.json(rows);
    } catch (err) {
        console.error('[playbooks/list]', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/playbooks/:id/download
router.get('/:id/download', authRequired, async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM playbooks WHERE id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Playbook not found' });

        const pb = rows[0];
        await db.query('UPDATE playbooks SET download_count = download_count + 1 WHERE id = ?', [pb.id]);

        // If it's a blob URL, redirect directly
        if (pb.file_path && pb.file_path.startsWith('http')) {
            return res.redirect(pb.file_path);
        }

        // Local file
        const uploadsPath = process.env.UPLOADS_PATH || path.join(__dirname, '..', 'uploads');
        // Handle case where file_path has /uploads/playbooks/ or just /uploads/
        // Also handle legacy file_paths
        const localPathPart = pb.file_path.replace(/^\/?uploads\//, '');
        const filePath = path.join(uploadsPath, localPathPart);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'File not found on server' });
        }
        res.download(filePath, pb.file_name || path.basename(pb.file_path));
    } catch (err) {
        console.error('[playbooks/download]', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/playbooks
router.post('/', authRequired, adminOnly, upload.single('file'), async (req, res) => {
    try {
        const { title, brief, framework, category } = req.body;
        if (!title || !framework || !req.file) {
            return res.status(400).json({ error: 'Title, framework, and file are required' });
        }

        const ext = path.extname(req.file.originalname).toLowerCase().replace('.', '');
        let filePath;
        let blobName = null;

        if (USE_BLOB) {
            // Uploads to documents/playbooks/ folder in blob
            const result = await uploadToBlob(
                req.file.buffer,
                req.file.originalname,
                req.file.mimetype,
                'playbooks'   // → documents/playbooks/
            );
            filePath = result.url;
            blobName = result.blobName;
        } else {
            filePath = `/uploads/playbooks/${req.file.filename}`;
        }

        const [result] = await db.query(
            'INSERT INTO playbooks (title, brief, framework, category, file_path, file_name, file_type, blob_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [title, brief || '', framework, category || 'Guide', filePath, req.file.originalname, ext, blobName]
        );

        res.status(201).json({ id: result.insertId, title, framework, category, file_type: ext });
    } catch (err) {
        console.error('[playbooks/create]', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// DELETE /api/playbooks/:id
router.delete('/:id', authRequired, adminOnly, async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM playbooks WHERE id = ?', [req.params.id]);
        if (rows.length > 0) {
            const pb = rows[0];
            if (pb.blob_name) {
                await deleteFromBlob(pb.blob_name);
            } else if (pb.file_path && !pb.file_path.startsWith('http')) {
                const uploadsPath = process.env.UPLOADS_PATH || path.join(__dirname, '..', 'uploads');
                const localPathPart = pb.file_path.replace(/^\/?uploads\//, '');
                const localPath = path.join(uploadsPath, localPathPart);
                if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
            }
        }
        await db.query('DELETE FROM playbooks WHERE id = ?', [req.params.id]);
        res.json({ message: 'Playbook deleted' });
    } catch (err) {
        console.error('[playbooks/delete]', err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;