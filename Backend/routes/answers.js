const router = require('express').Router();
const db = require('../Db');
const { authRequired, authOptional, adminOnly } = require('../middleware/auth');

// POST /api/answers — post an answer (logged-in or guest)
router.post('/', authOptional, async (req, res) => {
    const { question_id, content, email, name } = req.body;
    if (!question_id || !content) {
        return res.status(400).json({ error: 'question_id and content are required' });
    }

    try {
        let userId = req.user?.id;

        // Guest flow: find or create minimal user by email
        if (!userId) {
            if (!email) return res.status(400).json({ error: 'Email required for guests' });

            const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
            if (existing.length > 0) {
                userId = existing[0].id;
            } else {
                const [created] = await db.query(
                    'INSERT INTO users (email, name, password_hash) VALUES (?, ?, ?)',
                    [email, name || 'Guest', '$GUEST$NO_LOGIN_POSSIBLE$']
                );
                userId = created.insertId;
            }
        }

        // Verify question exists
        const [qRows] = await db.query('SELECT id FROM questions WHERE id = ?', [question_id]);
        if (qRows.length === 0) {
            return res.status(404).json({ error: 'Question not found' });
        }

        const is_official = req.user?.role === 'admin' ? 1 : 0;

        const [result] = await db.query(
            'INSERT INTO answers (question_id, user_id, content, is_official) VALUES (?, ?, ?, ?)',
            [question_id, userId, content, is_official]
        );

        // Auto-mark question as answered if official reply
        if (is_official) {
            await db.query("UPDATE questions SET status = 'answered' WHERE id = ?", [question_id]);
        }

        res.status(201).json({ id: result.insertId, message: 'Answer posted', is_official });
    } catch (err) {
        console.error('[answers/post]', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// DELETE /api/answers/:id — owner or admin can delete
router.delete('/:id', authRequired, async (req, res) => {
    try {
        const [rows] = await db.query('SELECT user_id FROM answers WHERE id = ?', [req.params.id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Answer not found' });
        }

        const isOwner = rows[0].user_id === req.user.id;
        const isAdmin = req.user.role === 'admin';

        if (!isOwner && !isAdmin) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        await db.query('DELETE FROM answers WHERE id = ?', [req.params.id]);
        res.json({ message: 'Answer deleted' });
    } catch (err) {
        console.error('[answers/delete]', err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;