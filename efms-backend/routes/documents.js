const express = require('express');
const multer = require('multer');
const path = require('path');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');
const { logAction } = require('../utils/auditLog');

const router = express.Router();

const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

 const storage = require('../utils/cloudinaryStorage');

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return cb(new Error('Only PDF, Word documents, and images (jpg, png) are allowed'));
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE }
});

router.post('/:employeeId', authenticateToken, (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    next();
  });
}, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const { document_type } = req.body;
    const { employeeId } = req.params;
    const [result] = await db.query(
      'INSERT INTO documents (employee_id, document_type, file_name, file_path) VALUES (?, ?, ?, ?)',
      [employeeId, document_type, req.file.originalname, req.file.path]
    );
    await logAction(req.user.id, 'UPLOAD', 'document', result.insertId, `Uploaded ${document_type} for employee ${employeeId}`);
    res.status(201).json({ id: result.insertId, message: 'Document uploaded' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to upload document' });
  }
});

router.get('/:employeeId', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM documents WHERE employee_id = ?', [req.params.employeeId]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    await db.query('DELETE FROM documents WHERE id=?', [req.params.id]);
    await logAction(req.user.id, 'DELETE', 'document', req.params.id, null);
    res.json({ message: 'Document deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

module.exports = router;