const express = require('express');
const multer = require('multer');

const {
  uploadMediaController,
  getAllMediaController,
} = require('../controllers/media-controller');
const { authenticateRequest } = require('../middleware/auth-middleware');
const logger = require('../utils/logger');

const router = express();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 3 * 1024 * 1024,
  },
}).single('file');

router.post(
  '/upload',
  authenticateRequest,
  (req, res, next) => {
    upload(req, res, function (err) {
      if (err instanceof multer.MulterError) {
        logger.error('Multer error while uploading:', err);
        return res.status(400).json({
          success: false,
          message: 'Multer error while uploading',
          error: err.message,
          stack: err.stack,
        });
      } else if (err) {
        logger.error('Unknown error occurred while uploading:', err);
        return res.status(500).json({
          success: false,
          message: 'Unknown error occurred while uploading',
          error: err.message,
          stack: err.stack,
        });
      }

      if (!req.file) {
        logger.error('No file found:');
        return res.status(400).json({
          success: false,
          message: 'No file found',
        });
      }

      next();
    });
  },
  uploadMediaController
);

router.get('/get', authenticateRequest, getAllMediaController)

module.exports = router;
