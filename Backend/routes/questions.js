const router = require('express').Router();
const db = require('../Db');
const { authRequired, authOptional, adminOnly } = require('../middleware/auth');

// GET /api/questions/my — logged-in user's own questions and answers
router.get('/my', async (req, res) => {
    // Try to authenticate from token but don't hard fail
    const { authRequired } = require('../middleware/auth');
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Login required' });
    const jwt = require('jsonwebtoken');
    let userId;
    try {
        const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET || 'airiskcouncil-super-secret-jwt-key-change-in-production');
        userId = decoded.id;
    } catch {
        return res.status(401).json({ error: 'Invalid token' });
    }
    try {
        const [questions] = await db.query(`
            SELECT q.*, u.name AS author_name, u.role AS author_role
            FROM questions q JOIN users u ON q.user_id = u.id
            WHERE q.user_id = ? ORDER BY q.created_at DESC
        `, [userId]);

        const [answers] = await db.query(`
            SELECT a.*, u.name AS author_name, q.title AS question_title
            FROM answers a
            JOIN users u ON a.user_id = u.id
            JOIN questions q ON a.question_id = q.id
            WHERE a.user_id = ? ORDER BY a.created_at DESC
        `, [userId]);

        res.json({ questions, answers });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/questions — list all questions
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT q.*, u.name AS author_name, u.role AS author_role
            FROM questions q
            JOIN users u ON q.user_id = u.id
            ORDER BY q.created_at DESC
        `);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/questions/search?q=term
router.get('/search', async (req, res) => {
    const { q } = req.query;
    if (!q || q.trim().length < 2) return res.status(400).json({ error: 'Query too short' });

    try {
        const term = `%${q}%`;
        const [rows] = await db.query(`
            SELECT q.*, u.name AS author_name, u.role AS author_role
            FROM questions q
            JOIN users u ON q.user_id = u.id
            WHERE q.title LIKE ? OR q.details LIKE ?
            ORDER BY q.created_at DESC
        `, [term, term]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/questions/:id — single question with answers
router.get('/:id', async (req, res) => {
    try {
        const [qRows] = await db.query(`
            SELECT q.*, u.name AS author_name, u.role AS author_role
            FROM questions q
            JOIN users u ON q.user_id = u.id
            WHERE q.id = ?
        `, [req.params.id]);

        if (qRows.length === 0) return res.status(404).json({ error: 'Question not found' });

        const [answers] = await db.query(`
            SELECT a.*, u.name AS author_name, u.role AS author_role
            FROM answers a
            JOIN users u ON a.user_id = u.id
            WHERE a.question_id = ?
            ORDER BY a.is_official DESC, a.created_at ASC
        `, [req.params.id]);

        res.json({ ...qRows[0], answers });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/questions — create question
// Supports both logged-in users and guests (guest creates ephemeral user by email)
router.post('/', authOptional, async (req, res) => {
    const { title, details, email, name, category } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required' });

    try {
        let userId = req.user?.id;

        // Guest flow: find or create user by email
        if (!userId) {
            if (!email) return res.status(400).json({ error: 'Email required for guests' });

            const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
            if (existing.length > 0) {
                userId = existing[0].id;
            } else {
                const [created] = await db.query(
                    'INSERT INTO users (email, name, password_hash) VALUES (?, ?, ?)',
                    [email, name || 'Guest', '']
                );
                userId = created.insertId;
            }
        }

        // Resolve category
        let categoryId = null;
        if (category) {
            const [catRows] = await db.query('SELECT id FROM categories WHERE slug = ? OR name = ?', [category, category]);
            if (catRows.length > 0) categoryId = catRows[0].id;
        }

        const [result] = await db.query(
            'INSERT INTO questions (user_id, category_id, title, details) VALUES (?, ?, ?, ?)',
            [userId, categoryId, title, details || null]
        );

        res.status(201).json({ id: result.insertId, message: 'Question posted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// DELETE /api/questions/:id — owner or admin can delete
router.delete('/:id', authRequired, async (req, res) => {
    try {
        const [rows] = await db.query('SELECT user_id FROM questions WHERE id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Question not found' });

        const isOwner = rows[0].user_id === req.user.id;
        const isAdmin = req.user.role === 'admin';

        if (!isOwner && !isAdmin) return res.status(403).json({ error: 'Not authorized' });

        await db.query('DELETE FROM questions WHERE id = ?', [req.params.id]);
        res.json({ message: 'Question deleted' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/questions/:id/answers — get all answers for a question
router.get('/:id/answers', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT a.*, u.name AS author_name, u.role AS author_role
            FROM answers a JOIN users u ON a.user_id = u.id
            WHERE a.question_id = ?
            ORDER BY a.is_official DESC, a.created_at ASC
        `, [req.params.id]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/questions/:id/answers — any logged-in user can post an answer
router.post('/:id/answers', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Login required' });
    const jwt = require('jsonwebtoken');
    let user;
    try {
        user = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET || 'airiskcouncil-super-secret-jwt-key-change-in-production');
    } catch {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }

    const { content } = req.body;
    if (!content || !content.trim()) return res.status(400).json({ error: 'Answer content is required' });

    try {
        const [qRows] = await db.query('SELECT id FROM questions WHERE id = ?', [req.params.id]);
        if (qRows.length === 0) return res.status(404).json({ error: 'Question not found' });

        const is_official = user.role === 'admin' ? 1 : 0;
        const [result] = await db.query(
            'INSERT INTO answers (question_id, user_id, content, is_official) VALUES (?, ?, ?, ?)',
            [req.params.id, user.id, content.trim(), is_official]
        );
        if (is_official) {
            await db.query("UPDATE questions SET status = 'answered' WHERE id = ?", [req.params.id]);
        }
        res.status(201).json({ id: result.insertId, message: 'Answer posted', is_official });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// PATCH /api/questions/:id/status — admin can change status
router.patch('/:id/status', authRequired, adminOnly, async (req, res) => {
    const { status } = req.body;
    const validStatuses = ['open', 'closed', 'answered'];
    if (!validStatuses.includes(status)) return res.status(400).json({ error: 'Invalid status' });

    try {
        await db.query('UPDATE questions SET status = ? WHERE id = ?', [status, req.params.id]);
        res.json({ message: 'Status updated' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;