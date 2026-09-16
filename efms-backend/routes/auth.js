const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { authenticateToken, requireAdmin, JWT_SECRET } = require('../middleware/auth');
const { logAction } = require('../utils/auditLog');
const { loginLimiter, selfRegisterLimiter } = require('../middleware/rateLimit');
const { isValidEmail, isNonEmptyString } = require('../utils/validate');

const router = express.Router();

const ALLOWED_ROLES = ['Employee', 'HR', 'DeptHead', 'Admin'];

router.post('/register', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { full_name, email, password, role, employee_id } = req.body;

    if (!isNonEmptyString(full_name)) {
      return res.status(400).json({ error: 'Full name is required' });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'A valid email is required' });
    }
    if (!isNonEmptyString(password) || password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }
    if (!ALLOWED_ROLES.includes(role)) {
      return res.status(400).json({ error: 'Invalid role selected' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      'INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [full_name.trim(), email.trim(), password_hash, role]
    );

    if (role === 'Employee' && employee_id) {
      await db.query('UPDATE employees SET user_id=? WHERE id=?', [result.insertId, employee_id]);
    }

    await logAction(req.user.id, 'REGISTER', 'user', result.insertId, `Created account for ${email} with role ${role}`);
    res.status(201).json({ id: result.insertId, message: 'User registered' });
  } catch (err) {
    console.error(err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }
    res.status(500).json({ error: 'Failed to register user' });
  }
});

router.post('/self-register', selfRegisterLimiter, async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!isNonEmptyString(token)) {
      return res.status(400).json({ error: 'This registration link is invalid or has expired' });
    }
    if (!isNonEmptyString(password) || password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const [rows] = await db.query(
      'SELECT * FROM employees WHERE registration_token = ? AND registration_token_expires > NOW()',
      [token]
    );
    if (rows.length === 0) {
      return res.status(400).json({ error: 'This registration link is invalid or has expired' });
    }

    const employee = rows[0];

    const [existingUser] = await db.query('SELECT id FROM users WHERE email = ?', [employee.email]);
    if (existingUser.length > 0) {
      return res.status(400).json({ error: 'An account already exists for this email' });
    }

    const role = employee.pending_role || 'Employee';

    const password_hash = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      'INSERT INTO users (full_name, email, password_hash, role, department_id) VALUES (?, ?, ?, ?, ?)',
      [employee.full_name, employee.email, password_hash, role, employee.department_id || null]
    );

    await db.query(
      'UPDATE employees SET user_id=?, registration_token=NULL, registration_token_expires=NULL, pending_role=NULL WHERE id=?',
      [result.insertId, employee.id]
    );

    if (role === 'DeptHead' && employee.department_id) {
      await db.query('UPDATE departments SET head_user_id=? WHERE id=?', [result.insertId, employee.department_id]);
    }

    await logAction(result.insertId, 'SELF_REGISTER', 'user', result.insertId, `Self-registered via invite link with role ${role}`);

    res.status(201).json({ message: 'Account created successfully. You can now log in.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to complete registration' });
  }
});

router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!isValidEmail(email) || !isNonEmptyString(password)) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email.trim()]);
    if (rows.length === 0) return res.status(401).json({ error: 'Invalid email or password' });

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ error: 'Invalid email or password' });

    if (user.role === 'Employee') {
      const [empRows] = await db.query('SELECT status FROM employees WHERE user_id = ?', [user.id]);
      if (empRows.length > 0 && empRows[0].status === 'Exited') {
        await logAction(user.id, 'LOGIN_BLOCKED', 'user', user.id, 'Login attempt by exited employee');
        return res.status(403).json({ error: 'This account is no longer active. Contact HR for assistance.' });
      }
    }

    const token = jwt.sign(
      { id: user.id, full_name: user.full_name, role: user.role, department_id: user.department_id },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    await logAction(user.id, 'LOGIN', 'user', user.id, null);

    res.json({
      token,
      user: { id: user.id, full_name: user.full_name, email: user.email, role: user.role, department_id: user.department_id }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to log in' });
  }
});

router.get('/my-employee-record', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT e.*, d.name AS department_name, p.title AS position_title, v.title AS vacancy_title
       FROM employees e
       LEFT JOIN departments d ON e.department_id = d.id
       LEFT JOIN positions p ON e.position_id = p.id
       LEFT JOIN vacancies v ON e.vacancy_id = v.id
       WHERE e.user_id = ?`,
      [req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'No linked employee record found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch your employee record' });
  }
});

module.exports = router;