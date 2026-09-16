require('dotenv').config();
const bcrypt = require('bcrypt');
const db = require('../db');

async function resetAdmin() {
  const email = 'admin@efms.local';
  const newPassword = 'ChangeMe123!';

  const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);

  const password_hash = await bcrypt.hash(newPassword, 10);

  if (existing.length > 0) {
    await db.query('UPDATE users SET password_hash = ?, role = ? WHERE email = ?', [password_hash, 'Admin', email]);
    console.log('Existing account password reset:');
  } else {
    await db.query(
      'INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      ['System Administrator', email, password_hash, 'Admin']
    );
    console.log('New admin account created:');
  }

  console.log(`  Email: ${email}`);
  console.log(`  Password: ${newPassword}`);
  console.log('IMPORTANT: Log in and change this password immediately.');
  process.exit(0);
}

resetAdmin().catch((err) => {
  console.error('Failed:', err);
  process.exit(1);
});