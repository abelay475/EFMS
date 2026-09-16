const express = require('express');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');
const { logAction } = require('../utils/auditLog');

const router = express.Router();

const STAFF_ROLES = ['Admin', 'HR', 'DeptHead'];

function requireStaff(req, res, next) {
  if (!STAFF_ROLES.includes(req.user.role)) {
    return res.status(403).json({ error: 'Messaging is only available to Admin, HR, and Department Head accounts' });
  }
  next();
}

// List every other Admin/HR/DeptHead user, for starting a new conversation.
router.get('/contacts', authenticateToken, requireStaff, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT u.id, u.full_name, u.role, d.name AS department_name
       FROM users u
       LEFT JOIN departments d ON u.department_id = d.id
       WHERE u.role IN ('Admin', 'HR', 'DeptHead') AND u.id != ?
       ORDER BY u.full_name`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
});

// Conversation list: one row per person I've exchanged messages with,
// most recent message first, with an unread count from that person.
router.get('/conversations', authenticateToken, requireStaff, async (req, res) => {
  try {
    const { id } = req.user;
    const [rows] = await db.query(
      `SELECT u.id AS user_id, u.full_name, u.role,
              lm.body AS last_body, lm.created_at AS last_at, lm.sender_id AS last_sender_id,
              lm.is_staffing_request AS last_is_staffing_request,
              COALESCE(uc.unread_count, 0) AS unread_count
       FROM (
         SELECT IF(sender_id = ?, recipient_id, sender_id) AS counterpart_id, MAX(id) AS max_id
         FROM messages
         WHERE sender_id = ? OR recipient_id = ?
         GROUP BY counterpart_id
       ) t
       JOIN messages lm ON lm.id = t.max_id
       JOIN users u ON u.id = t.counterpart_id
       LEFT JOIN (
         SELECT sender_id, COUNT(*) AS unread_count
         FROM messages
         WHERE recipient_id = ? AND is_read = FALSE
         GROUP BY sender_id
       ) uc ON uc.sender_id = u.id
       ORDER BY lm.created_at DESC`,
      [id, id, id, id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// Full thread with one specific person.
router.get('/with/:userId', authenticateToken, requireStaff, async (req, res) => {
  try {
    const otherId = req.params.userId;
    const [rows] = await db.query(
      `SELECT m.*, s.full_name AS sender_name
       FROM messages m
       JOIN users s ON m.sender_id = s.id
       WHERE (m.sender_id = ? AND m.recipient_id = ?) OR (m.sender_id = ? AND m.recipient_id = ?)
       ORDER BY m.created_at ASC`,
      [req.user.id, otherId, otherId, req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch conversation' });
  }
});

// Mark every message from that person to me as read.
router.put('/with/:userId/read', authenticateToken, requireStaff, async (req, res) => {
  try {
    await db.query(
      'UPDATE messages SET is_read = TRUE WHERE sender_id = ? AND recipient_id = ? AND is_read = FALSE',
      [req.params.userId, req.user.id]
    );
    res.json({ message: 'Marked as read' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update messages' });
  }
});

router.post('/', authenticateToken, requireStaff, async (req, res) => {
  try {
    const { recipient_id, body, is_staffing_request, related_vacancy_id } = req.body;
    if (!recipient_id || !body || !body.trim()) {
      return res.status(400).json({ error: 'A recipient and a message are required' });
    }

    const [recipientRows] = await db.query('SELECT id, role FROM users WHERE id = ?', [recipient_id]);
    if (recipientRows.length === 0 || !STAFF_ROLES.includes(recipientRows[0].role)) {
      return res.status(400).json({ error: 'Invalid recipient' });
    }

    // Only a DeptHead can flag a message as a staffing request, and only
    // when sending to HR or Admin (the roles that can create vacancies).
    const staffingFlag = !!is_staffing_request
      && req.user.role === 'DeptHead'
      && ['HR', 'Admin'].includes(recipientRows[0].role);

    const [result] = await db.query(
      'INSERT INTO messages (sender_id, recipient_id, body, is_staffing_request, related_vacancy_id) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, recipient_id, body.trim(), staffingFlag, related_vacancy_id || null]
    );

    await logAction(
      req.user.id,
      'CREATE',
      'message',
      result.insertId,
      `${staffingFlag ? 'Staffing request' : 'Message'} sent to user ${recipient_id}`
    );

    res.status(201).json({ id: result.insertId, message: 'Message sent' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

module.exports = router;