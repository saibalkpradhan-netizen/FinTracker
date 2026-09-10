const express = require('express');
const { protect } = require('../middleware/auth');
const { validateCategory, list, getOne, create, update, remove } = require('../controllers/categoriesController');

const router = express.Router();

router.use(protect); // every route below requires a valid JWT

router.route('/')
  .get(list)
  .post(validateCategory, create);

router.route('/:id')
  .get(getOne)
  .put(validateCategory, update)
  .delete(remove);

module.exports = router;
