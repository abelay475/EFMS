const express = require('express');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// GET /audit-log?page=&limit=&search=
// Defaults to the most recent 20 entries. Pass ?search= to filter by
// action, entity type, user name, or the free-text details column;
// ?page=/?limit= paginate through the (optionally filtered) results so
// the frontend can load more as the user scrolls instead of pulling
// everything at once.
router.get('/', authenticateToken, async (req, res) => {
  try {
    const conditions = [];
    const params = [];

    const search = (req.query.search || '').trim();
    if (search) {
      conditions.push(
        '(audit_log.action LIKE ? OR audit_log.entity_type LIKE ? OR audit_log.details LIKE ? OR users.full_name LIKE ?)'
      );
      const like = `%${search}%`;
      params.push(like, like, like, like);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const offset = (page - 1) * limit;

    const [countRows] = await db.query(
      `SELECT COUNT(*) AS total
       FROM audit_log
       LEFT JOIN users ON audit_log.user_id = users.id
       ${whereClause}`,
      params
    );
    const total = countRows[0].total;

    const [rows] = await db.query(
      `SELECT audit_log.*, users.full_name, users.role
       FROM audit_log
       LEFT JOIN users ON audit_log.user_id = users.id
       ${whereClause}
       ORDER BY audit_log.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    res.json({ logs: rows, total, page, limit });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch audit log' });
  }
});

module.exports = router;