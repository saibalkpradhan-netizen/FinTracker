const asyncHandler = require('express-async-handler');
const { body, validationResult } = require('express-validator');
const db = require('../config/db');

function checkValidation(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400);
    throw new Error(errors.array().map((e) => e.msg).join('; '));
  }
}

const validateCategory = [
  body('name').trim().isLength({ min: 1, max: 80 }).withMessage('Name must be 1-80 characters'),
  body('type').isIn(['income', 'expense']).withMessage('Type must be income or expense'),
];

// GET /api/categories?type=income|expense
// Returns system defaults (user_id IS NULL) plus this user's custom categories.
const list = asyncHandler(async (req, res) => {
  const { type } = req.query;
  const params = [req.user.id];
  let query = `SELECT id, user_id, name, type, is_default
               FROM categories
               WHERE (user_id IS NULL OR user_id = $1)`;
  if (type) {
    params.push(type);
    query += ` AND type = $${params.length}`;
  }
  query += ' ORDER BY type, is_default DESC, name';

  const { rows } = await db.query(query, params);
  res.json({ categories: rows });
});

const getOne = asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    `SELECT id, user_id, name, type, is_default FROM categories
     WHERE id = $1 AND (user_id IS NULL OR user_id = $2)`,
    [req.params.id, req.user.id]
  );
  if (!rows[0]) {
    res.status(404);
    throw new Error('Category not found');
  }
  res.json({ category: rows[0] });
});

// POST /api/categories - create a custom category owned by the user
const create = asyncHandler(async (req, res) => {
  checkValidation(req, res);
  const { name, type } = req.body;

  const { rows } = await db.query(
    `INSERT INTO categories (user_id, name, type, is_default)
     VALUES ($1, $2, $3, false)
     RETURNING id, user_id, name, type, is_default`,
    [req.user.id, name.trim(), type]
  );
  res.status(201).json({ category: rows[0] });
});

// PUT /api/categories/:id - rename a custom category (defaults are immutable)
const update = asyncHandler(async (req, res) => {
  checkValidation(req, res);
  const { name, type } = req.body;

  const existing = await db.query('SELECT * FROM categories WHERE id = $1 AND user_id = $2', [
    req.params.id,
    req.user.id,
  ]);
  if (!existing.rows[0]) {
    res.status(404);
    throw new Error('Category not found or not editable (default categories cannot be changed)');
  }

  const { rows } = await db.query(
    `UPDATE categories SET name = $1, type = $2 WHERE id = $3 AND user_id = $4
     RETURNING id, user_id, name, type, is_default`,
    [name.trim(), type, req.params.id, req.user.id]
  );
  res.json({ category: rows[0] });
});

// DELETE /api/categories/:id - only the owner's own custom categories can be deleted
const remove = asyncHandler(async (req, res) => {
  const existing = await db.query('SELECT * FROM categories WHERE id = $1 AND user_id = $2', [
    req.params.id,
    req.user.id,
  ]);
  if (!existing.rows[0]) {
    res.status(404);
    throw new Error('Category not found or not deletable (default categories cannot be removed)');
  }

  // Transactions/budgets referencing this category keep their row (category_id -> NULL
  // via ON DELETE SET NULL / the FK on budgets restricts deletion while budgets exist).
  await db.query('DELETE FROM categories WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
  res.json({ message: 'Category deleted' });
});

module.exports = { validateCategory, list, getOne, create, update, remove };
