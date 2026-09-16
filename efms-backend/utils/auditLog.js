const db = require('../db');

async function logAction(userId, action, entityType, entityId, details) {
  try {
    await db.query(
      'INSERT INTO audit_log (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)',
      [userId, action, entityType, entityId, details]
    );
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
}

module.exports = { logAction };