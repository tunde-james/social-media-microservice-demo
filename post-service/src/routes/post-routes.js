const express = require('express');

const {
  createPostController,
  getAllPostController,
  getPostController,
  deletePostController
} = require('../controllers/post-controller');
const { authenticateRequest } = require('../middleware/auth-middleware');

const router = express.Router();

router.use(authenticateRequest);

router.post('/create-post', createPostController);
router.get('/all-post', getAllPostController);
router.get('/:postId', getPostController);
router.delete('/:postId', deletePostController);

module.exports = router;
