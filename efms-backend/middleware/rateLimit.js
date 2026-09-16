const rateLimit = require('express-rate-limit');

// Login: slows down password-guessing. Keyed by IP by default, so one
// bad actor doesn't lock out everyone else on the same network for long.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please try again in a few minutes.' }
});

// Public application submissions — stops spam/bot applications.
const applicationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many applications submitted. Please try again later.' }
});

// Public status check — stops brute-forcing reference codes/emails.
const statusCheckLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many status checks. Please try again in a few minutes.' }
});

// Self-registration — the token is the real protection, this just stops
// someone hammering the endpoint trying to guess a valid one.
const selfRegisterLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please try again in a few minutes.' }
});

module.exports = { loginLimiter, applicationLimiter, statusCheckLimiter, selfRegisterLimiter };