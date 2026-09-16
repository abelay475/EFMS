const express = require('express');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const db = require('../db');
const { sendEmail } = require('../utils/mailer');
const { applicationLimiter, statusCheckLimiter } = require('../middleware/rateLimit');
const { isValidEmail, isNonEmptyString, isValidPhone } = require('../utils/validate');

const router = express.Router();

const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

 const storage = require('../utils/cloudinaryStorage');

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return cb(new Error('Only PDF, Word documents, and images (jpg, png) are allowed'));
  }
  cb(null, true);
};

const upload = multer({ storage, fileFilter, limits: { fileSize: MAX_FILE_SIZE } });

function generateReferenceCode() {
  const year = new Date().getFullYear();
  const random = crypto.randomInt(1000, 9999);
  return `APP-${year}-${random}`;
}

// Public - submit an application to a vacancy
router.post('/', applicationLimiter, (req, res, next) => {
  upload.single('cv')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    next();
  });
}, async (req, res) => {
  try {
    const { vacancy_id, full_name, email, phone } = req.body;

    if (!isNonEmptyString(full_name)) {
      return res.status(400).json({ error: 'Full name is required' });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'A valid email is required' });
    }
    if (!isValidPhone(phone)) {
      return res.status(400).json({ error: 'A valid phone number is required' });
    }
    if (!isNonEmptyString(String(vacancy_id || ''))) {
      return res.status(400).json({ error: 'A vacancy must be selected' });
    }
    if (!req.file) return res.status(400).json({ error: 'CV file is required' });

    const [vacancyRows] = await db.query(
      "SELECT * FROM vacancies WHERE id = ? AND status = 'Open' AND deleted_at IS NULL",
      [vacancy_id]
    );
    if (vacancyRows.length === 0) {
      return res.status(400).json({ error: 'This vacancy is not open for applications' });
    }
    const vacancy = vacancyRows[0];

    const [existingApplicant] = await db.query(
      'SELECT id FROM employees WHERE email = ? AND deleted_at IS NULL',
      [email.trim()]
    );
    if (existingApplicant.length > 0) {
      return res.status(409).json({ error: 'A user with this email already exists' });
    }

    let reference_code = generateReferenceCode();
    let unique = false;
    while (!unique) {
      const [existing] = await db.query('SELECT id FROM employees WHERE reference_code = ?', [reference_code]);
      if (existing.length === 0) {
        unique = true;
      } else {
        reference_code = generateReferenceCode();
      }
    }

    const [result] = await db.query(
      'INSERT INTO employees (full_name, email, phone, status, vacancy_id, department_id, reference_code) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [full_name.trim(), email.trim(), phone.trim(), 'Applicant', vacancy_id, vacancy.department_id || null, reference_code]
    );

    await db.query(
      'INSERT INTO documents (employee_id, document_type, file_name, file_path) VALUES (?, ?, ?, ?)',
      [result.insertId, 'CV', req.file.originalname, req.file.path]
    );

    await sendEmail(
      email,
      'Application Received - Wollega University',
      `Dear ${full_name},\n\nThank you for applying for the "${vacancy.title}" position at Wollega University.\n\nYour application reference code is: ${reference_code}\n\nYou can use this code along with your email at any time to check your application status.\n\nWollega University`
    );

    res.status(201).json({
      message: 'Application submitted successfully',
      reference_code
    });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'A user with this email already exists' });
    }
    console.error(err);
    res.status(500).json({ error: 'Failed to submit application' });
  }
});

// Public - check status via reference code + email
router.post('/status', statusCheckLimiter, async (req, res) => {
  try {
    const { reference_code, email } = req.body;

    if (!isNonEmptyString(reference_code) || !isValidEmail(email)) {
      return res.status(400).json({ error: 'A valid reference code and email are required' });
    }

    const [rows] = await db.query(
      `SELECT e.status, v.title AS vacancy_title 
       FROM employees e 
       LEFT JOIN vacancies v ON e.vacancy_id = v.id 
       WHERE e.reference_code = ? AND e.email = ?`,
      [reference_code.trim(), email.trim()]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'No application found with that reference code and email' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to check application status' });
  }
});

module.exports = router;