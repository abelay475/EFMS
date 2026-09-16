const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(value) {
  return typeof value === 'string' && EMAIL_RE.test(value.trim());
}

function isNonEmptyString(value, maxLength = 255) {
  return typeof value === 'string' && value.trim().length > 0 && value.trim().length <= maxLength;
}

// Loose on purpose — just catches garbage input, not strict about
// international formats.
function isValidPhone(value) {
  return typeof value === 'string' && /^[\d\s()+-]{6,20}$/.test(value.trim());
}

module.exports = { isValidEmail, isNonEmptyString, isValidPhone };