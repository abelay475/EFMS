const express = require('express');
const crypto = require('crypto');
const multer = require('multer');
const path = require('path');
const db = require('../db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { logAction } = require('../utils/auditLog');
const { sendEmail } = require('../utils/mailer');

const router = express.Router();

const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return cb(new Error('Only PDF, Word documents, and images (jpg, png) are allowed'));
  }
  cb(null, true);
};

const upload = multer({ storage, fileFilter, limits: { fileSize: MAX_FILE_SIZE } });

router.post('/', authenticateToken, (req, res, next) => {
  upload.single('cv')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    next();
  });
}, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'A CV file is required to add an employee' });
    }
    const { full_name, email, phone, department_id, position_id, status, hire_date } = req.body;
    const [result] = await db.query(
      'INSERT INTO employees (full_name, email, phone, department_id, position_id, status, hire_date) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [full_name, email, phone, department_id || null, position_id || null, status, hire_date]
    );

    await db.query(
      'INSERT INTO documents (employee_id, document_type, file_name, file_path) VALUES (?, ?, ?, ?)',
      [result.insertId, 'CV', req.file.originalname, req.file.path]
    );

    await logAction(req.user.id, 'CREATE', 'employee', result.insertId, `Created employee ${full_name} with CV`);
    res.status(201).json({ id: result.insertId, message: 'Employee created' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create employee' });
  }
});

router.get('/', authenticateToken, async (req, res) => {
  try {
    const isDeptHead = req.user.role === 'DeptHead';

    const conditions = ['e.deleted_at IS NULL'];
    const params = [];

    // DeptHead can only ever see employees in their own department.
    if (isDeptHead) {
      conditions.push('e.department_id = ?');
      params.push(req.user.department_id);
    }

    const search = (req.query.search || '').trim();
    if (search) {
      conditions.push('(e.full_name LIKE ? OR e.email LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const baseQuery = `
      SELECT e.*, u.role AS linked_role, d.name AS department_name, p.title AS position_title,
             v.department_id AS vacancy_department_id, v.title AS vacancy_title
      FROM employees e
      LEFT JOIN users u ON e.user_id = u.id
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN positions p ON e.position_id = p.id
      LEFT JOIN vacancies v ON e.vacancy_id = v.id
      ${whereClause}
      ORDER BY e.id DESC
    `;

    // Pagination is opt-in via ?page= / ?limit= so existing callers that
    // don't send these params still get the full (department-scoped) list
    // unchanged, until the frontend is wired to use paging + search.
    if (req.query.page || req.query.limit) {
      const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
      const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
      const offset = (page - 1) * limit;

      const [countRows] = await db.query(
        `SELECT COUNT(*) AS total FROM employees e ${whereClause}`,
        params
      );
      const total = countRows[0].total;

      const [rows] = await db.query(`${baseQuery} LIMIT ? OFFSET ?`, [...params, limit, offset]);
      return res.json({ employees: rows, total, page, limit });
    }

    const [rows] = await db.query(baseQuery, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { full_name, email, phone, department_id, position_id, status, hire_date } = req.body;

    const [beforeRows] = await db.query(
      `SELECT e.status, e.user_id, e.vacancy_id, e.hire_date, u.is_super_admin, v.department_id AS vacancy_department_id
       FROM employees e
       LEFT JOIN users u ON e.user_id = u.id
       LEFT JOIN vacancies v ON e.vacancy_id = v.id
       WHERE e.id = ?`,
      [req.params.id]
    );
    if (beforeRows.length === 0) return res.status(404).json({ error: 'Employee not found' });
    const before = beforeRows[0];
    const previousStatus = before.status;
    const isSuperAdminRecord = !!before.is_super_admin;
    const isSelf = before.user_id === req.user.id;
    const isApplicantTrack = !!before.vacancy_id;

    if (isSuperAdminRecord && status !== previousStatus && !isSelf) {
      return res.status(403).json({ error: 'This account is protected — its status cannot be changed by another user' });
    }

    // Applicant review workflow — only applies to candidates who applied via /apply
    if (isApplicantTrack && status !== previousStatus && req.user.role !== 'Admin') {
      const APPLICANT_TO_REVIEW = previousStatus === 'Applicant' && status === 'Under Review';
      const APPLICANT_TO_REJECTED = previousStatus === 'Applicant' && status === 'Rejected';
      const REVIEW_TO_INTERVIEW = previousStatus === 'Under Review' && status === 'Interview';
      const INTERVIEW_TO_DECISION = previousStatus === 'Interview' && (status === 'Hired' || status === 'Rejected');

      if (APPLICANT_TO_REVIEW || APPLICANT_TO_REJECTED) {
        if (req.user.role !== 'HR') {
          return res.status(403).json({ error: 'Only HR can make this decision' });
        }
      } else if (REVIEW_TO_INTERVIEW || INTERVIEW_TO_DECISION) {
        if (req.user.role !== 'DeptHead') {
          return res.status(403).json({ error: 'Only the Department Head can make this decision' });
        }
        if (req.user.department_id !== before.vacancy_department_id) {
          return res.status(403).json({ error: 'You can only review applicants for your own department' });
        }
      } else {
        return res.status(400).json({ error: 'Invalid status transition for an applicant' });
      }
    }

    // FIX: self-applicants (via /apply) never have a hire_date — the public
    // application form doesn't collect one. Stamp it automatically the
    // moment an applicant is actually marked "Hired", unless a hire_date
    // was already set or explicitly supplied in this request.
    let finalHireDate = hire_date;
    if (isApplicantTrack && status === 'Hired' && !finalHireDate && !before.hire_date) {
      finalHireDate = new Date().toISOString().slice(0, 10);
    }

    await db.query(
      'UPDATE employees SET full_name=?, email=?, phone=?, department_id=?, position_id=?, status=?, hire_date=? WHERE id=?',
      [full_name, email, phone, department_id || null, position_id || null, status, finalHireDate, req.params.id]
    );
    await logAction(req.user.id, 'UPDATE', 'employee', req.params.id, `Updated employee ${full_name}`);

    if (status !== previousStatus && status === 'Interview') {
      await sendEmail(
        email,
        'Interview Invitation - Wollega University',
        `Dear ${full_name},\n\nCongratulations! You have been selected for an interview.\nOur HR team will contact you shortly with the schedule.\n\nWollega University`
      );
    }

    if (status !== previousStatus && status === 'Rejected') {
      await sendEmail(
        email,
        'Application Update - Wollega University',
        `Dear ${full_name},\n\nThank you for your interest in this position. After careful review, we have decided not to move forward with your application at this time.\n\nWe encourage you to apply for future openings.\n\nWollega University`
      );
    }

    res.json({ message: 'Employee updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update employee' });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT e.id, e.user_id, u.role AS linked_role, u.is_super_admin
       FROM employees e
       LEFT JOIN users u ON e.user_id = u.id
       WHERE e.id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Employee not found' });
    const target = rows[0];

    if (target.is_super_admin) {
      return res.status(403).json({ error: 'This account is protected and cannot be deleted' });
    }

    if (req.user.role !== 'Admin') {
      if (target.user_id === req.user.id) {
        return res.status(403).json({ error: 'You cannot delete your own employee record' });
      }
      if (['HR', 'DeptHead', 'Admin'].includes(target.linked_role)) {
        return res.status(403).json({ error: 'Only an Admin can delete a record linked to a staff account' });
      }
    }

    await db.query('UPDATE employees SET deleted_at = NOW() WHERE id=?', [req.params.id]);
    await logAction(req.user.id, 'SOFT_DELETE', 'employee', req.params.id, null);
    res.json({ message: 'Employee deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete employee' });
  }
});

router.post('/:id/grant-access', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { role } = req.body;
    const allowedRoles = ['Employee', 'HR', 'DeptHead', 'Admin'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role selected' });
    }

    const [rows] = await db.query('SELECT * FROM employees WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Employee not found' });
    const employee = rows[0];

    if (employee.vacancy_id && employee.status !== 'Hired') {
      return res.status(400).json({ error: 'This applicant must reach "Hired" status before access can be granted' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours

    await db.query(
      'UPDATE employees SET registration_token=?, registration_token_expires=?, pending_role=? WHERE id=?',
      [token, expires, role, req.params.id]
    );

    const registrationLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/self-register?token=${token}`;

    await sendEmail(
      employee.email,
      'Set Up Your EFMS Account - Wollega University',
      `Dear ${employee.full_name},\n\nWelcome to the team! You can now set up your account to access the Employee File Management System.\n\nClick the link below to create your password (valid for 48 hours):\n${registrationLink}\n\nWollega University`
    );

    await logAction(req.user.id, 'GRANT_ACCESS', 'employee', req.params.id, `Portal access (${role}) link sent to ${employee.email}`);

    res.json({ message: 'Registration link sent to employee' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to grant portal access' });
  }
});

module.exports = router;