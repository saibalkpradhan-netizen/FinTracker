const asyncHandler = require('express-async-handler');
const { body, query, validationResult } = require('express-validator');
const db = require('../config/db');

function checkValidation(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400);
    throw new Error(errors.array().map((e) => e.msg).join('; '));
  }
}

const validateTransaction = [
  body('type').isIn(['income', 'expense']).withMessage('Type must be income or expense'),
  body('amount').isFloat({ gt: 0 }).withMessage('Amount must be a positive number'),
  body('date').isISO8601().withMessage('Date must be a valid date (YYYY-MM-DD)'),
  body('category_id').isUUID().withMessage('A valid category_id is required'),
  body('description').optional({ nullable: true }).isLength({ max: 255 }),
  body('payment_method').optional({ nullable: true }).isLength({ max: 50 }),
  body('notes').optional({ nullable: true }).isLength({ max: 2000 }),
];

const validateListQuery = [
  query('type').optional().isIn(['income', 'expense']),
  query('category_id').optional().isUUID(),
  query('date_from').optional().isISO8601(),
  query('date_to').optional().isISO8601(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 200 }),
];

// A category is usable by this user if it's a system default or theirs, AND
// its type matches the transaction type — prevents e.g. filing an expense
// under an income-only category.
async function assertCategoryUsable(categoryId, type, userId) {
  const { rows } = await db.query(
    `SELECT id FROM categories WHERE id = $1 AND type = $2 AND (user_id IS NULL OR user_id = $3)`,
    [categoryId, type, userId]
  );
  if (!rows[0]) {
    const err = new Error('category_id is invalid for this transaction type, or not accessible to you');
    err.statusCode = 400;
    throw err;
  }
}

// GET /api/transactions?type=&category_id=&date_from=&date_to=&search=&page=&limit=
const list = asyncHandler(async (req, res) => {
  checkValidation(req, res);
  const { type, category_id, date_from, date_to, search } = req.query;
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 25;
  const offset = (page - 1) * limit;

  const conditions = ['t.user_id = $1'];
  const params = [req.user.id];

  if (type) {
    params.push(type);
    conditions.push(`t.type = $${params.length}`);
  }
  if (category_id) {
    params.push(category_id);
    conditions.push(`t.category_id = $${params.length}`);
  }
  if (date_from) {
    params.push(date_from);
    conditions.push(`t.date >= $${params.length}`);
  }
  if (date_to) {
    params.push(date_to);
    conditions.push(`t.date <= $${params.length}`);
  }
  if (search) {
    params.push(`%${search}%`);
    conditions.push(`t.description ILIKE $${params.length}`);
  }

  const whereClause = conditions.join(' AND ');

  const countResult = await db.query(`SELECT COUNT(*) FROM transactions t WHERE ${whereClause}`, params);
  const total = parseInt(countResult.rows[0].count, 10);

  params.push(limit, offset);
  const { rows } = await db.query(
    `SELECT t.id, t.type, t.amount, t.date, t.description, t.payment_method, t.notes,
            t.created_at, t.category_id, c.name AS category_name
     FROM transactions t
     LEFT JOIN categories c ON c.id = t.category_id
     WHERE ${whereClause}
     ORDER BY t.date DESC, t.created_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  res.json({
    transactions: rows,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  });
});

const getOne = asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    `SELECT t.*, c.name AS category_name
     FROM transactions t LEFT JOIN categories c ON c.id = t.category_id
     WHERE t.id = $1 AND t.user_id = $2`,
    [req.params.id, req.user.id]
  );
  if (!rows[0]) {
    res.status(404);
    throw new Error('Transaction not found');
  }
  res.json({ transaction: rows[0] });
});

const create = asyncHandler(async (req, res) => {
  checkValidation(req, res);
  const { type, amount, date, category_id, description, payment_method, notes } = req.body;
  await assertCategoryUsable(category_id, type, req.user.id);

  const { rows } = await db.query(
    `INSERT INTO transactions (user_id, category_id, type, amount, date, description, payment_method, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     RETURNING *`,
    [req.user.id, category_id, type, amount, date, description || null, payment_method || null, notes || null]
  );
  res.status(201).json({ transaction: rows[0] });
});

const update = asyncHandler(async (req, res) => {
  checkValidation(req, res);
  const existing = await db.query('SELECT id FROM transactions WHERE id = $1 AND user_id = $2', [
    req.params.id,
    req.user.id,
  ]);
  if (!existing.rows[0]) {
    res.status(404);
    throw new Error('Transaction not found');
  }

  const { type, amount, date, category_id, description, payment_method, notes } = req.body;
  await assertCategoryUsable(category_id, type, req.user.id);

  const { rows } = await db.query(
    `UPDATE transactions SET
       type = $1, amount = $2, date = $3, category_id = $4,
       description = $5, payment_method = $6, notes = $7
     WHERE id = $8 AND user_id = $9
     RETURNING *`,
    [type, amount, date, category_id, description || null, payment_method || null, notes || null, req.params.id, req.user.id]
  );
  res.json({ transaction: rows[0] });
});

const remove = asyncHandler(async (req, res) => {
  const { rowCount } = await db.query('DELETE FROM transactions WHERE id = $1 AND user_id = $2', [
    req.params.id,
    req.user.id,
  ]);
  if (!rowCount) {
    res.status(404);
    throw new Error('Transaction not found');
  }
  res.json({ message: 'Transaction deleted' });
});

module.exports = { validateTransaction, validateListQuery, list, getOne, create, update, remove };
