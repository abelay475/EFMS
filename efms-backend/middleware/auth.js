const jwt = require('jsonwebtoken');
const db = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret_later';

async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  jwt.verify(token, JWT_SECRET, async (err, decoded) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });

    try {
      const [rows] = await db.query(
        `SELECT u.id, u.role, u.department_id, e.status AS employee_status, e.deleted_at
         FROM users u
         LEFT JOIN employees e ON e.user_id = u.id
         WHERE u.id = ?`,
        [decoded.id]
      );

      if (rows.length === 0) {
        return res.status(403).json({ error: 'This account no longer exists' });
      }

      const account = rows[0];

      if (account.deleted_at) {
        return res.status(403).json({ error: 'Your access has been revoked. Contact HR for assistance.' });
      }

      if (account.employee_status === 'Exited') {
        return res.status(403).json({ error: 'This account is no longer active. Contact HR for assistance.' });
      }

      req.user = {
        id: account.id,
        full_name: decoded.full_name,
        role: account.role,
        department_id: account.department_id
      };
      next();
    } catch (dbErr) {
      console.error(dbErr);
      res.status(500).json({ error: 'Failed to verify account status' });
    }
  });
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'Admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

module.exports = { authenticateToken, requireAdmin, JWT_SECRET };