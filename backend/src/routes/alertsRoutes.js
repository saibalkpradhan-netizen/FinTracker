const express = require('express');
const { protect } = require('../middleware/auth');
const { list, getOne, create, update, remove } = require('../controllers/alertsController');

const router = express.Router();

router.use(protect); // every route below requires a valid JWT

router.route('/')
  .get(list)
  .post(create);

router.route('/:id')
  .get(getOne)
  .put(update)
  .delete(remove);

module.exports = router;
