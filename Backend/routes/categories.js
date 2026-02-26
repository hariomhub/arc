const router = require('express').Router();
const db = require('../Db');
const { authRequired, adminOnly } = require('../middleware/auth');

// GET /api/categories
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM categories ORDER BY name ASC');
        res.json(rows);
    } catch (err) {
        console.error('[categories/list]', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/categories — admin only
// Note: 'slug' column does not exist in the schema. Using name + description only.
router.post('/', authRequired, adminOnly, async (req, res) => {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: 'Name required' });

    try {
        const [result] = await db.query(
            'INSERT INTO categories (name, description) VALUES (?, ?)',
            [name, description || null]
        );
        res.status(201).json({ id: result.insertId, name, description: description || null });
    } catch (err) {
        console.error('[categories/post]', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// DELETE /api/categories/:id — admin only
router.delete('/:id', authRequired, adminOnly, async (req, res) => {
    try {
        await db.query('DELETE FROM categories WHERE id = ?', [req.params.id]);
        res.json({ message: 'Category deleted' });
    } catch (err) {
        console.error('[categories/delete]', err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;