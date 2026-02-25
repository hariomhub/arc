const router = require('express').Router();
const db = require('../Db');
const { authRequired, adminOnly } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Configure Multer for Team Member Image Uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'team-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

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

// POST /api/team (Admin Only)
router.post('/', authRequired, adminOnly, upload.single('image'), async (req, res) => {
    const { name, role, description, linkedin_url, category } = req.body;
    if (!name || !role) return res.status(400).json({ error: 'Name and role are required' });

    // Handle image path correctly focusing on cross-platform compatibility
    let imageUrl = '';
    if (req.file) {
        // e.g., 'uploads\\team-123.jpg' -> '/uploads/team-123.jpg'
        imageUrl = '/' + req.file.path.replace(/\\/g, '/');
    }

    try {
        const [result] = await db.query(
            'INSERT INTO team_members (name, role, description, linkedin_url, image_url, categories) VALUES (?, ?, ?, ?, ?, ?)',
            [name, role, description || '', linkedin_url || '', imageUrl, req.body.categories || '["leadership"]']
        );
        res.status(201).json({ id: result.insertId, name, role, description, linkedin_url, image_url: imageUrl, categories: req.body.categories || '["leadership"]' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error creating team member' });
    }
});

// PUT /api/team/:id (Admin Only)
router.put('/:id', authRequired, adminOnly, upload.single('image'), async (req, res) => {
    const { name, role, description, linkedin_url, category } = req.body;
    let imageUrl = req.body.image_url; // fallback if no new image

    if (req.file) {
        imageUrl = '/' + req.file.path.replace(/\\/g, '/');
    }

    try {
        await db.query(
            'UPDATE team_members SET name=?, role=?, description=?, linkedin_url=?, image_url=?, categories=? WHERE id=?',
            [name, role, description || '', linkedin_url || '', imageUrl, req.body.categories || '["leadership"]', req.params.id]
        );
        res.json({ message: 'Team member updated', image_url: imageUrl });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error updating team member' });
    }
});

// DELETE /api/team/:id (Admin Only)
router.delete('/:id', authRequired, adminOnly, async (req, res) => {
    try {
        await db.query('DELETE FROM team_members WHERE id=?', [req.params.id]);
        res.json({ message: 'Team member deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error deleting team member' });
    }
});

module.exports = router;
