const express = require('express');
const db = require('../db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { logAction } = require('../utils/auditLog');

const router = express.Router();

// Normalize an incoming deadline value to MySQL's DATE format ('YYYY-MM-DD').
// Accepts a plain 'YYYY-MM-DD' string as-is, converts full ISO datetime
// strings (e.g. '2026-09-17T07:00:00.000Z', which is what a JS Date
// serializes to) down to just the date part, and returns null for
// empty/invalid input so an unset deadline stores as NULL instead of
// crashing the query.
function normalizeDeadline(value) {
  if (!value) return null;
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }
  const parsed = new Date(value);
  if (isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
}

// Public - anyone can view open vacancies
router.get('/public', async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, title, department, description, deadline FROM vacancies WHERE status = 'Open' AND deleted_at IS NULL ORDER BY created_at DESC"
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch vacancies' });
  }
});

// Internal - full list including closed/pending ones, but never soft-deleted ones
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM vacancies WHERE deleted_at IS NULL ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch vacancies' });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'HR' && req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Only HR can create vacancies' });
    }
    const { title, department_id, description, deadline } = req.body;

    if (!department_id) {
      return res.status(400).json({ error: 'Please select a department' });
    }

    const [deptRows] = await db.query('SELECT name FROM departments WHERE id = ?', [department_id]);
    if (deptRows.length === 0) {
      return res.status(400).json({ error: 'Selected department does not exist' });
    }
    const departmentName = deptRows[0].name;

    const [result] = await db.query(
      'INSERT INTO vacancies (title, department, department_id, description, deadline, status, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [title, departmentName, department_id, description, normalizeDeadline(deadline), 'Pending Approval', req.user.id]
    );
    await logAction(req.user.id, 'CREATE', 'vacancy', result.insertId, `Drafted vacancy for approval: ${title}`);
    res.status(201).json({ id: result.insertId, message: 'Vacancy submitted for approval' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create vacancy' });
  }
});

// FIX: previously had no role check at all — any authenticated user
// (Employee included) could PUT arbitrary vacancy fields, including
// directly setting `status` to 'Open' and skipping the Admin approval
// step entirely. The frontend only ever calls this route from the
// HR-only Close/Reopen button, so the backend now enforces that same
// HR-only restriction instead of relying on the button being hidden.
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'HR') {
      return res.status(403).json({ error: 'Only HR can update a vacancy' });
    }

    const { title, department_id, description, deadline, status } = req.body;

    let departmentName = null;
    if (department_id) {
      const [deptRows] = await db.query('SELECT name FROM departments WHERE id = ?', [department_id]);
      if (deptRows.length === 0) {
        return res.status(400).json({ error: 'Selected department does not exist' });
      }
      departmentName = deptRows[0].name;
    }

    await db.query(
      'UPDATE vacancies SET title=?, department=?, department_id=?, description=?, deadline=?, status=? WHERE id=?',
      [title, departmentName, department_id || null, description, normalizeDeadline(deadline), status, req.params.id]
    );
    await logAction(req.user.id, 'UPDATE', 'vacancy', req.params.id, `Updated vacancy: ${title}`);
    res.json({ message: 'Vacancy updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update vacancy' });
  }
});

router.put('/:id/approve', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await db.query("UPDATE vacancies SET status = 'Open' WHERE id = ?", [req.params.id]);
    await logAction(req.user.id, 'APPROVE', 'vacancy', req.params.id, 'Vacancy approved and published');
    res.json({ message: 'Vacancy approved and now open' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to approve vacancy' });
  }
});

router.put('/:id/reject', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { reason } = req.body;
    await db.query("UPDATE vacancies SET status = 'Rejected' WHERE id = ?", [req.params.id]);
    await logAction(req.user.id, 'REJECT', 'vacancy', req.params.id, reason || 'Vacancy rejected');
    res.json({ message: 'Vacancy rejected' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to reject vacancy' });
  }
});

// Soft delete only — a vacancy's title is still read live (via join) by any
// employee record that applied through it, for as long as that employee
// exists. Hard-deleting the row used to blank out "Position" for every
// self-applicant who was hired through it, since their record has no
// position_id of its own and falls back to the vacancy's title. Soft
// delete keeps the row (and that title) intact while still hiding it from
// every "active" list below.
//
// FIX: previously had no role check at all — any authenticated user
// (Employee included) could hit this directly and soft-delete a vacancy,
// even though the frontend only ever shows the delete button to Admin/HR.
// Locked down to the same HR/Admin check used on POST /.
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'HR' && req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Only HR or Admin can delete a vacancy' });
    }
    await db.query('UPDATE vacancies SET deleted_at = NOW() WHERE id=?', [req.params.id]);
    await logAction(req.user.id, 'SOFT_DELETE', 'vacancy', req.params.id, null);
    res.json({ message: 'Vacancy deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete vacancy' });
  }
});

module.exports = router;