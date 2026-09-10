const rateLimit = require('express-rate-limit');

// Applied only to /auth/register and /auth/login to slow down credential
// stuffing / brute-force attempts without throttling normal API usage.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many attempts, please try again in a few minutes.' },
});

module.exports = { authLimiter };
