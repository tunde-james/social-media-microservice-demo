const express = require('express');

const {
  searchPostController,
} = require('../controllers/search-post-controller');
const { authenticateRequest } = require('../middleware/auth-middleware');

const router = express.Router();

router.use(authenticateRequest);

router.get('/posts', searchPostController);

module.exports = router;
