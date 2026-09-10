const asyncHandler = require('express-async-handler');
const db = require('../config/db');

// TODO (Phase 2): implement full reports business logic.
// Every query here MUST be scoped to req.user.id — never trust a client-supplied user id.

const list = asyncHandler(async (req, res) => {
  res.status(501).json({ message: 'reports list endpoint not yet implemented' });
});

const getOne = asyncHandler(async (req, res) => {
  res.status(501).json({ message: 'reports getOne endpoint not yet implemented' });
});

const create = asyncHandler(async (req, res) => {
  res.status(501).json({ message: 'reports create endpoint not yet implemented' });
});

const update = asyncHandler(async (req, res) => {
  res.status(501).json({ message: 'reports update endpoint not yet implemented' });
});

const remove = asyncHandler(async (req, res) => {
  res.status(501).json({ message: 'reports remove endpoint not yet implemented' });
});

module.exports = { list, getOne, create, update, remove };
