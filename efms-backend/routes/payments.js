const express = require('express');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');
const { logAction } = require('../utils/auditLog');

const router = express.Router();

router.post('/:employeeId', authenticateToken, async (req, res) => {
  try {
    const { amount, payment_type, payment_date, notes } = req.body;
    const { employeeId } = req.params;
    const [result] = await db.query(
      'INSERT INTO payments (employee_id, amount, payment_type, payment_date, notes) VALUES (?, ?, ?, ?, ?)',
      [employeeId, amount, payment_type, payment_date, notes]
    );
    await logAction(req.user.id, 'CREATE', 'payment', result.insertId, `Recorded ${payment_type} payment of ${amount} for employee ${employeeId}`);
    res.status(201).json({ id: result.insertId, message: 'Payment recorded' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to record payment' });
  }
});

router.get('/:employeeId', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM payments WHERE employee_id = ? ORDER BY payment_date DESC',
      [req.params.employeeId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    await db.query('DELETE FROM payments WHERE id=?', [req.params.id]);
    await logAction(req.user.id, 'DELETE', 'payment', req.params.id, null);
    res.json({ message: 'Payment deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete payment' });
  }
});

module.exports = router;