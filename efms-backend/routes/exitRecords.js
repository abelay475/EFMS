const express = require('express');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');
const { logAction } = require('../utils/auditLog');

const router = express.Router();

const STAFF_ROLES = ['HR', 'Admin'];

// POST /exit-records/:employeeId
// - Employee submitting for their OWN record: creates a Pending exit
//   request. Does NOT change employee status yet — it still needs to be
//   acknowledged by their Department Head, then finalized by HR.
// - HR/Admin recording an exit directly (termination, contract end, or
//   any offboarding they're initiating themselves): created already
//   Finalized, and the employee is marked Exited immediately — same
//   behavior as before this flow existed.
router.post('/:employeeId', authenticateToken, async (req, res) => {
  try {
    const { exit_type, exit_date, reason } = req.body;
    const { employeeId } = req.params;

    if (!exit_type || !exit_date) {
      return res.status(400).json({ error: 'Exit type and exit date are required' });
    }

    const isStaff = STAFF_ROLES.includes(req.user.role);

    if (!isStaff) {
      const [empRows] = await db.query(
        'SELECT id FROM employees WHERE id = ? AND user_id = ?',
        [employeeId, req.user.id]
      );
      if (empRows.length === 0) {
        return res.status(403).json({ error: 'You can only request your own exit' });
      }

      const [existing] = await db.query(
        "SELECT id FROM exit_records WHERE employee_id = ? AND status IN ('Pending', 'Acknowledged')",
        [employeeId]
      );
      if (existing.length > 0) {
        return res.status(400).json({ error: 'You already have an exit request in progress' });
      }

      const [result] = await db.query(
        'INSERT INTO exit_records (employee_id, exit_type, exit_date, reason, status) VALUES (?, ?, ?, ?, ?)',
        [employeeId, exit_type, exit_date, reason, 'Pending']
      );
      await logAction(req.user.id, 'CREATE', 'exit_record', result.insertId, `${exit_type} requested (pending Department Head acknowledgement)`);
      return res.status(201).json({ id: result.insertId, message: 'Exit request submitted — your Department Head will be notified' });
    }

    const [result] = await db.query(
      'INSERT INTO exit_records (employee_id, exit_type, exit_date, reason, status) VALUES (?, ?, ?, ?, ?)',
      [employeeId, exit_type, exit_date, reason, 'Finalized']
    );
    await db.query('UPDATE employees SET status=? WHERE id=?', ['Exited', employeeId]);
    await logAction(req.user.id, 'CREATE', 'exit_record', result.insertId, `${exit_type} recorded for employee ${employeeId}`);
    res.status(201).json({ id: result.insertId, message: 'Exit recorded' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to record exit' });
  }
});

router.get('/:employeeId', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM exit_records WHERE employee_id = ? ORDER BY exit_date DESC',
      [req.params.employeeId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch exit records' });
  }
});

// DeptHead's queue — pending exit requests from their own department
router.get('/department/pending', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'DeptHead') {
      return res.status(403).json({ error: 'Only a Department Head can view this queue' });
    }
    const [rows] = await db.query(
      `SELECT er.*, e.full_name AS employee_name, e.department_id
       FROM exit_records er
       JOIN employees e ON er.employee_id = e.id
       WHERE e.department_id = ? AND er.status = 'Pending'
       ORDER BY er.exit_date ASC`,
      [req.user.department_id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch department exit queue' });
  }
});

// HR's queue — Department Head-acknowledged exits awaiting finalization
router.get('/hr/queue', authenticateToken, async (req, res) => {
  try {
    if (!STAFF_ROLES.includes(req.user.role)) {
      return res.status(403).json({ error: 'Only HR can view this queue' });
    }
    const [rows] = await db.query(
      `SELECT er.*, e.full_name AS employee_name, d.name AS department_name
       FROM exit_records er
       JOIN employees e ON er.employee_id = e.id
       LEFT JOIN departments d ON e.department_id = d.id
       WHERE er.status = 'Acknowledged'
       ORDER BY er.exit_date ASC`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch HR exit queue' });
  }
});

router.put('/:id/acknowledge', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'DeptHead') {
      return res.status(403).json({ error: 'Only a Department Head can perform this action' });
    }
    const [rows] = await db.query(
      `SELECT er.id, er.status, e.department_id
       FROM exit_records er
       JOIN employees e ON er.employee_id = e.id
       WHERE er.id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Exit request not found' });
    if (rows[0].department_id !== req.user.department_id) {
      return res.status(403).json({ error: 'You can only act on requests from your own department' });
    }
    if (rows[0].status !== 'Pending') {
      return res.status(400).json({ error: 'This request has already been acknowledged' });
    }

    await db.query("UPDATE exit_records SET status='Acknowledged' WHERE id=?", [req.params.id]);
    await logAction(req.user.id, 'ACKNOWLEDGE', 'exit_record', req.params.id, 'Department Head acknowledged this exit request');
    res.json({ message: 'Exit request acknowledged and forwarded to HR' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to acknowledge exit request' });
  }
});

router.put('/:id/finalize', authenticateToken, async (req, res) => {
  try {
    if (!STAFF_ROLES.includes(req.user.role)) {
      return res.status(403).json({ error: 'Only HR can finalize an exit request' });
    }
    const [rows] = await db.query('SELECT employee_id, status FROM exit_records WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Exit request not found' });
    if (rows[0].status !== 'Acknowledged') {
      return res.status(400).json({ error: 'This request has not been acknowledged by a Department Head yet' });
    }

    await db.query("UPDATE exit_records SET status='Finalized' WHERE id=?", [req.params.id]);
    await db.query("UPDATE employees SET status='Exited' WHERE id=?", [rows[0].employee_id]);
    await logAction(req.user.id, 'FINALIZE', 'exit_record', req.params.id, 'HR finalized this exit — employee marked Exited');
    res.json({ message: 'Exit finalized — employee marked as Exited' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to finalize exit request' });
  }
});

// An employee can cancel their OWN exit request while it's still Pending
// (mirrors the same self-cancel pattern used for time off requests).
// Staff roles can delete any exit_record regardless of status, unchanged.
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT er.id, er.status, e.user_id AS owner_user_id
       FROM exit_records er
       JOIN employees e ON er.employee_id = e.id
       WHERE er.id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Exit record not found' });
    const record = rows[0];

    const isOwner = record.owner_user_id === req.user.id;
    const isStaff = ['HR', 'Admin', 'DeptHead'].includes(req.user.role);

    if (!isOwner && !isStaff) {
      return res.status(403).json({ error: 'You can only cancel your own exit request' });
    }
    if (isOwner && !isStaff && record.status !== 'Pending') {
      return res.status(400).json({ error: 'This request has already been acknowledged and can no longer be cancelled' });
    }

    await db.query('DELETE FROM exit_records WHERE id=?', [req.params.id]);
    await logAction(req.user.id, 'DELETE', 'exit_record', req.params.id, null);
    res.json({ message: 'Exit record deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete exit record' });
  }
});

module.exports = router;