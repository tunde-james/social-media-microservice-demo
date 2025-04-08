const express = require('express');

const {
  registerUserController,
  loginUserController,
  refreshTokenController,
  logoutUserController,
} = require('../controllers/auth-controller');

const router = express.Router();

router.post('/register', registerUserController);
router.post('/login', loginUserController);
router.post('/refresh-token', refreshTokenController);
router.post('/logout', logoutUserController);

module.exports = router;
