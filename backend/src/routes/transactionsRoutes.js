const express = require('express');
const { protect } = require('../middleware/auth');
const {
  validateTransaction,
  validateListQuery,
  list,
  getOne,
  create,
  update,
  remove,
} = require('../controllers/transactionsController');

const router = express.Router();

router.use(protect); // every route below requires a valid JWT

router.route('/')
  .get(validateListQuery, list)
  .post(validateTransaction, create);

router.route('/:id')
  .get(getOne)
  .put(validateTransaction, update)
  .delete(remove);

module.exports = router;
