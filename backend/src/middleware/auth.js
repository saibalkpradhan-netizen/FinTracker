const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const db = require('../config/db');

// Verifies the JWT on protected routes and attaches { id, email } to req.user.
// Every downstream query MUST filter by req.user.id so users only ever touch
// their own rows (see each controller).
const protect = asyncHandler(async (req, res, next) => {
  let token;
  const header = req.headers.authorization;

  if (header && header.startsWith('Bearer ')) {
    token = header.split(' ')[1];
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token provided');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { rows } = await db.query('SELECT id, name, email, currency FROM users WHERE id = $1', [decoded.id]);

    if (!rows[0]) {
      res.status(401);
      throw new Error('Not authorized, user no longer exists');
    }

    req.user = rows[0];
    next();
  } catch (err) {
    res.status(401);
    throw new Error('Not authorized, token invalid or expired');
  }
});

module.exports = { protect };
