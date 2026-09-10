const bcrypt = require('bcrypt');
const asyncHandler = require('express-async-handler');
const { body, validationResult } = require('express-validator');
const db = require('../config/db');
const generateToken = require('../utils/generateToken');

const SALT_ROUNDS = 12;

const validateRegister = [
  body('name').trim().isLength({ min: 2, max: 120 }).withMessage('Name must be 2-120 characters'),
  body('email').isEmail().normalizeEmail().withMessage('A valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/\d/)
    .withMessage('Password must contain at least one number'),
];

const validateLogin = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
];

function checkValidation(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400);
    throw new Error(errors.array().map((e) => e.msg).join('; '));
  }
}

// @route POST /api/auth/register
const register = asyncHandler(async (req, res) => {
  checkValidation(req, res);
  const { name, email, password } = req.body;

  const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rows[0]) {
    res.status(409);
    throw new Error('An account with that email already exists');
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const { rows } = await db.query(
    `INSERT INTO users (name, email, password_hash)
     VALUES ($1, $2, $3)
     RETURNING id, name, email, currency, created_at`,
    [name, email, passwordHash]
  );

  const user = rows[0];
  res.status(201).json({
    user,
    token: generateToken(user.id),
  });
});

// @route POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  checkValidation(req, res);
  const { email, password } = req.body;

  const { rows } = await db.query(
    'SELECT id, name, email, currency, password_hash FROM users WHERE email = $1',
    [email]
  );
  const user = rows[0];

  // Same generic message whether the email doesn't exist or the password is
  // wrong, so we don't leak which emails are registered.
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  delete user.password_hash;
  res.json({ user, token: generateToken(user.id) });
});

// @route GET /api/auth/profile
const getProfile = asyncHandler(async (req, res) => {
  res.json({ user: req.user });
});

// @route PUT /api/auth/profile
const updateProfile = asyncHandler(async (req, res) => {
  const { name, currency, monthly_savings_target } = req.body;
  const { rows } = await db.query(
    `UPDATE users SET
       name = COALESCE($1, name),
       currency = COALESCE($2, currency),
       monthly_savings_target = COALESCE($3, monthly_savings_target)
     WHERE id = $4
     RETURNING id, name, email, currency, monthly_savings_target`,
    [name, currency, monthly_savings_target, req.user.id]
  );
  res.json({ user: rows[0] });
});

// @route PUT /api/auth/password
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!newPassword || newPassword.length < 8) {
    res.status(400);
    throw new Error('New password must be at least 8 characters');
  }

  const { rows } = await db.query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
  const valid = await bcrypt.compare(currentPassword, rows[0].password_hash);
  if (!valid) {
    res.status(401);
    throw new Error('Current password is incorrect');
  }

  const newHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, req.user.id]);
  res.json({ message: 'Password updated successfully' });
});

module.exports = {
  validateRegister,
  validateLogin,
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
};
