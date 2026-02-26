const router = require('express').Router();
const db = require('../Db');
const { authRequired, adminOnly } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { uploadToBlob, deleteFromBlob, USE_BLOB } = require('../blobStorage');

// ─── Profile Image Upload ─────────────────────────────────────────────────────
const getProfileDir = () => {
    const base = process.env.UPLOADS_PATH
        ? path.resolve(process.env.UPLOADS_PATH)
        : path.join(__dirname, '..', 'uploads');
    const dir = path.join(base, 'profiles');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    return dir;
};

const profileUpload = multer({
    storage: USE_BLOB
        ? multer.memoryStorage()
        : multer.diskStorage({
            destination: (req, file, cb) => cb(null, getProfileDir()),
            filename: (req, file, cb) =>
                cb(null, `user_${req.user.id}_${Date.now()}${path.extname(file.originalname)}`)
        }),
    fileFilter: (req, file, cb) =>
        cb(null, /\.(jpg|jpeg|png|webp|gif)$/i.test(file.originalname)),
    limits: { fileSize: 5 * 1024 * 1024 }
});

// GET /api/users/me/questions
router.get('/me/questions', authRequired, async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT q.*, (SELECT COUNT(*) FROM answers a WHERE a.question_id = q.id) AS answer_count
             FROM questions q WHERE q.user_id = ? ORDER BY q.created_at DESC`,
            [req.user.id]
        );
        res.json(rows);
    } catch (err) {
        console.error('[users/me/questions]', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/users/me/answers
router.get('/me/answers', authRequired, async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT a.*, q.title AS question_title FROM answers a
             JOIN questions q ON a.question_id = q.id
             WHERE a.user_id = ? ORDER BY a.created_at DESC`,
            [req.user.id]
        );
        res.json(rows);
    } catch (err) {
        console.error('[users/me/answers]', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/users/me/profile
router.get('/me/profile', authRequired, async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT id, name, email, role, approval_status, organization_name, phone,
                    bio, linkedin_url, twitter_url, website_url, profile_image, created_at
             FROM users WHERE id = ?`,
            [req.user.id]
        );
        if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
        res.json(rows[0]);
    } catch (err) {
        console.error('[users/me/profile]', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// PUT /api/users/me/profile — update own profile
router.put('/me/profile', authRequired, profileUpload.single('profile_image'), async (req, res) => {
    const { name, bio, linkedin_url, twitter_url, website_url, organization_name, phone } = req.body;
    try {
        const updates = [];
        const values = [];

        if (name)                           { updates.push('name = ?');              values.push(name); }
        if (bio !== undefined)              { updates.push('bio = ?');               values.push(bio); }
        if (linkedin_url !== undefined)     { updates.push('linkedin_url = ?');      values.push(linkedin_url); }
        if (twitter_url !== undefined)      { updates.push('twitter_url = ?');       values.push(twitter_url); }
        if (website_url !== undefined)      { updates.push('website_url = ?');       values.push(website_url); }
        if (organization_name !== undefined){ updates.push('organization_name = ?'); values.push(organization_name); }
        if (phone !== undefined)            { updates.push('phone = ?');             values.push(phone); }

        if (req.file) {
            let imagePath;

            if (USE_BLOB) {
                // Delete old blob image if exists
                const [existing] = await db.query(
                    'SELECT profile_blob_name FROM users WHERE id = ?', [req.user.id]
                );
                if (existing[0]?.profile_blob_name) {
                    await deleteFromBlob(existing[0].profile_blob_name);
                }
                // Upload to images/profiles/
                const result = await uploadToBlob(
                    req.file.buffer,
                    req.file.originalname,
                    req.file.mimetype,
                    'profiles'
                );
                imagePath = result.url;
                updates.push('profile_blob_name = ?');
                values.push(result.blobName);
            } else {
                imagePath = `/uploads/profiles/${req.file.filename}`;
            }

            updates.push('profile_image = ?');
            values.push(imagePath);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        values.push(req.user.id);
        await db.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);

        const [rows] = await db.query(
            `SELECT id, name, email, role, approval_status, organization_name, phone,
                    bio, linkedin_url, twitter_url, website_url, profile_image, created_at
             FROM users WHERE id = ?`,
            [req.user.id]
        );
        res.json(rows[0]);
    } catch (err) {
        console.error('[users/me/profile/put]', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/users — admin only
router.get('/', authRequired, adminOnly, async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT id, name, email, role, approval_status, organization_name,
                    gst, pan, incorporation_number, phone, is_banned, created_at
             FROM users ORDER BY created_at DESC`
        );
        res.json(rows);
    } catch (err) {
        console.error('[users/list]', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// PATCH /api/users/:id/role — admin only
router.patch('/:id/role', authRequired, adminOnly, async (req, res) => {
    const { role } = req.body;
    const validRoles = ['user', 'member', 'admin', 'executive', 'university', 'company'];
    if (!validRoles.includes(role)) {
        return res.status(400).json({ error: 'Invalid role.' });
    }
    try {
        await db.query('UPDATE users SET role = ? WHERE id = ?', [role, req.params.id]);
        res.json({ message: `Role updated to ${role}` });
    } catch (err) {
        console.error('[users/:id/role]', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// PATCH /api/users/:id/approval_status — admin only
router.patch('/:id/approval_status', authRequired, adminOnly, async (req, res) => {
    const { status } = req.body;
    if (!['pending', 'approved', 'rejected'].includes(status)) {
        return res.status(400).json({ error: 'Invalid approval status' });
    }
    try {
        await db.query('UPDATE users SET approval_status = ? WHERE id = ?', [status, req.params.id]);
        res.json({ message: `Approval status updated to ${status}` });
    } catch (err) {
        console.error('[users/:id/approval_status]', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// PATCH /api/users/:id/ban — admin only
router.patch('/:id/ban', authRequired, adminOnly, async (req, res) => {
    const { is_banned } = req.body;
    try {
        await db.query('UPDATE users SET is_banned = ? WHERE id = ?', [is_banned ? 1 : 0, req.params.id]);
        res.json({ message: `User ${is_banned ? 'banned' : 'unbanned'}` });
    } catch (err) {
        console.error('[users/:id/ban]', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// DELETE /api/users/:id — admin only
router.delete('/:id', authRequired, adminOnly, async (req, res) => {
    try {
        await db.query('DELETE FROM users WHERE id = ?', [req.params.id]);
        res.json({ message: 'User deleted' });
    } catch (err) {
        console.error('[users/:id/delete]', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/users — admin only
router.post('/', authRequired, adminOnly, async (req, res) => {
    const bcrypt = require('bcrypt');
    const { name, email, password, role, organization_name, gst, pan, incorporation_number, phone } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ error: 'Name, email, and password required' });
    }
    try {
        const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) return res.status(409).json({ error: 'Email already registered' });

        const password_hash = await bcrypt.hash(password, 12);
        const validRoles = ['user', 'member', 'university', 'company', 'admin', 'executive'];
        const assignedRole = validRoles.includes(role) ? role : 'user';

        const [result] = await db.query(
            `INSERT INTO users (name, email, password_hash, role, approval_status,
                                organization_name, gst, pan, incorporation_number, phone)
             VALUES (?, ?, ?, ?, 'approved', ?, ?, ?, ?, ?)`,
            [name, email, password_hash, assignedRole,
             organization_name || null, gst || null, pan || null,
             incorporation_number || null, phone || null]
        );

        res.status(201).json({ message: 'User created successfully', id: result.insertId });
    } catch (err) {
        console.error('[users/post]', err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;