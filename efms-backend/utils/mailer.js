const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

async function sendEmail(to, subject, text) {
  try {
    await transporter.sendMail({
      from: `"EFMS - Wollega University" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text
    });
    return true;
  } catch (err) {
    console.error('Failed to send email:', err);
    return false;
  }
}

module.exports = { sendEmail };