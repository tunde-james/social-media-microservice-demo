const RefreshToken = require('../models/refresh-token-model');
const User = require('../models/user-model');
const generateTokens = require('../utils/generate-token');
const logger = require('../utils/logger');
const { validateRegistration, validateLogin } = require('../utils/validation');

const registerUserController = async (req, res) => {
  logger.info('Registration endpoint hit...');

  try {
    const { error } = validateRegistration(req.body);
    if (error) {
      logger.warn('Validation error', error.details[0].message);
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const { username, email, password } = req.body;

    let user = await User.findOne({ $or: [{ username }, { email }] });
    if (user) {
      logger.warn('User already exists');
      return res.status(400).json({
        success: false,
        message: 'User already exists',
      });
    }

    user = new User({ username, email, password });
    await user.save();
    logger.warn('User saved successfully', user._id);

    const { accessToken, refreshToken } = await generateTokens(user);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      accessToken,
      refreshToken,
    });
  } catch (err) {
    logger.error('Registration error occurred', err);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

const loginUserController = async (req, res) => {
  logger.info('Login endpoint hit...');

  try {
    const { error } = validateLogin(req.body);
    if (error) {
      logger.warn('Validation error', error.details[0].message);
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      logger.warn('Invalid user');
      return res.status(400).json({
        success: false,
        message: 'Inavlid credentials',
      });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      logger.warn('Invalid password');
      return res.status(400).json({
        success: false,
        message: 'Inavlid password',
      });
    }

    const { accessToken, refreshToken } = await generateTokens(user);

    res.json({
      accessToken,
      refreshToken,
      userId: user._id,
    });
  } catch (err) {
    logger.error('Registration error occurred', err);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

const refreshTokenController = async (req, res) => {
  logger.info('Refresh token endpoint hit...');
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      logger.warn('Refresh token missing');
      return res.status(400).json({
        success: false,
        message: 'Refresh token missing',
      });
    }

    const storedToken = await RefreshToken.findOne({ token: refreshToken });

    if (!storedToken) {
      logger.warn('Invalid refresh token provided');
      return res.status(400).json({
        success: false,
        message: 'Invalid refresh token',
      });
    }

    if (!storedToken || storedToken.expiresAt < new Date()) {
      logger.warn('Invalid or expired refresh token');

      return res.status(401).json({
        success: false,
        message: `Invalid or expired refresh token`,
      });
    }

    const user = await User.findById(storedToken.user);

    if (!user) {
      logger.warn('User not found');

      return res.status(401).json({
        success: false,
        message: `User not found`,
      });
    }

    const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
      await generateTokens(user);

    //delete the old refresh token
    await RefreshToken.deleteOne({ _id: storedToken._id });

    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (err) {
    logger.error('Refresh token error occurred', err);
    res.status(500).json({
      success: false,
      message: 'Refresh token error occurred',
    });
  }
};

const logoutUserController = async (req, res) => {
  logger.info('Logout endpoint hit...');

  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      logger.warn('Refresh token missing');
      return res.status(400).json({
        success: false,
        message: 'Refresh token missing',
      });
    }

    const storedToken = await RefreshToken.findOneAndDelete({
      token: refreshToken,
    });
    if (!storedToken) {
      logger.warn('Invalid refresh token provided');
      return res.status(400).json({
        success: false,
        message: 'Invalid refresh token',
      });
    }
    logger.info('Refresh token deleted for logout');

    res.json({
      success: true,
      message: 'Logged out successfully!',
    });
  } catch (err) {
    logger.error('Error while logging out', err);
    res.status(500).json({
      success: false,
      message: 'Error while logging out',
    });
  }
};

module.exports = {
  registerUserController,
  loginUserController,
  refreshTokenController,
  logoutUserController,
};
