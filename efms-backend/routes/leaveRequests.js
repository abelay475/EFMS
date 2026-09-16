const express = require('express');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');
const { logAction } = require('../utils/auditLog');

const router = express.Router();

router.post('/:employeeId', authenticateToken, async (req, res) => {
  try {
    const { leave_type, start_date, end_date, reason } = req.body;
    const { employeeId } = req.params;
    const [result] = await db.query(
      'INSERT INTO leave_requests (employee_id, leave_type, start_date, end_date, reason, status) VALUES (?, ?, ?, ?, ?, ?)',
      [employeeId, leave_type, start_date, end_date, reason, 'Pending']
    );
    await logAction(req.user.id, 'CREATE', 'leave_request', result.insertId, `${leave_type} leave requested for employee ${employeeId}`);
    res.status(201).json({ id: result.insertId, message: 'Leave request submitted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to submit leave request' });
  }
});

router.get('/:employeeId', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM leave_requests WHERE employee_id = ? ORDER BY requested_at DESC',
      [req.params.employeeId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch leave requests' });
  }
});

// DeptHead's queue — only their own department's pending requests
router.get('/department/pending', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'DeptHead') {
      return res.status(403).json({ error: 'Only a Department Head can view this queue' });
    }
    const [rows] = await db.query(
      `SELECT lr.*, e.full_name AS employee_name, e.department_id
       FROM leave_requests lr
       JOIN employees e ON lr.employee_id = e.id
       WHERE e.department_id = ? AND lr.status = 'Pending'
       ORDER BY lr.requested_at ASC`,
      [req.user.department_id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch department leave queue' });
  }
});

// HR's queue — DeptHead-approved requests awaiting finalization
router.get('/hr/queue', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'HR' && req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Only HR can view this queue' });
    }
    const [rows] = await db.query(
      `SELECT lr.*, e.full_name AS employee_name, d.name AS department_name
       FROM leave_requests lr
       JOIN employees e ON lr.employee_id = e.id
       LEFT JOIN departments d ON e.department_id = d.id
       WHERE lr.status = 'DeptHead Approved'
       ORDER BY lr.requested_at ASC`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch HR leave queue' });
  }
});

router.put('/:id/depthead-decision', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'DeptHead') {
      return res.status(403).json({ error: 'Only a Department Head can perform this action' });
    }
    const { decision } = req.body; // 'Approved' or 'Rejected'

    const [rows] = await db.query(
      `SELECT lr.id, e.department_id
       FROM leave_requests lr
       JOIN employees e ON lr.employee_id = e.id
       WHERE lr.id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Leave request not found' });
    if (rows[0].department_id !== req.user.department_id) {
      return res.status(403).json({ error: 'You can only act on requests from your own department' });
    }

    const newStatus = decision === 'Approved' ? 'DeptHead Approved' : 'Rejected';
    await db.query('UPDATE leave_requests SET status=? WHERE id=?', [newStatus, req.params.id]);
    await logAction(req.user.id, 'DEPTHEAD_DECISION', 'leave_request', req.params.id, `Department Head ${decision.toLowerCase()} this request`);
    res.json({ message: `Leave request ${newStatus}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update leave request' });
  }
});

router.put('/:id/finalize', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'HR' && req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Only HR can finalize a leave request' });
    }
    const [rows] = await db.query('SELECT status FROM leave_requests WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Leave request not found' });
    if (rows[0].status !== 'DeptHead Approved') {
      return res.status(400).json({ error: 'This request has not been approved by a Department Head yet' });
    }

    await db.query("UPDATE leave_requests SET status='Finalized' WHERE id=?", [req.params.id]);
    await logAction(req.user.id, 'FINALIZE', 'leave_request', req.params.id, 'HR finalized this leave request');
    res.json({ message: 'Leave request finalized' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to finalize leave request' });
  }
});

// An employee can only cancel their OWN request, and only while it's
// still Pending and within 5 minutes of submitting it (a short window
// in case of a change of mind — once a Department Head or HR has
// looked at it, or that window has passed, it can no longer be
// self-cancelled). Staff roles are unrestricted, as before.
const SELF_CANCEL_WINDOW_MS = 5 * 60 * 1000;

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT lr.id, lr.status, lr.requested_at, e.user_id AS owner_user_id
       FROM leave_requests lr
       JOIN employees e ON lr.employee_id = e.id
       WHERE lr.id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Leave request not found' });
    const request = rows[0];

    const isOwner = request.owner_user_id === req.user.id;
    const isStaff = ['HR', 'Admin', 'DeptHead'].includes(req.user.role);

    if (!isOwner && !isStaff) {
      return res.status(403).json({ error: 'You can only cancel your own time off requests' });
    }

    if (isOwner && !isStaff) {
      if (request.status !== 'Pending') {
        return res.status(400).json({ error: 'This request has already been reviewed and can no longer be cancelled' });
      }
      const requestedAt = new Date(request.requested_at).getTime();
      if (Date.now() - requestedAt > SELF_CANCEL_WINDOW_MS) {
        return res.status(400).json({ error: 'The 5-minute cancellation window for this request has passed' });
      }
    }

    await db.query('DELETE FROM leave_requests WHERE id=?', [req.params.id]);
    await logAction(req.user.id, 'DELETE', 'leave_request', req.params.id, null);
    res.json({ message: 'Time off request cancelled' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to cancel time off request' });
  }
});

module.exports = router;