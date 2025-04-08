require('dotenv').config();
const mongoose = require('mongoose');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const { RateLimiterRedis } = require('rate-limiter-flexible');
const Redis = require('ioredis');
const { rateLimit } = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');

const logger = require('./utils/logger');
const routes = require('./routes/auth-service-route');
const errorHandler = require('./middleware/error-handler');

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => logger.info('Connected to MongoDB'))
  .catch((error) => logger.error('MongoDB connection error', error));

const redisClient = new Redis(process.env.REDIS_URL);

const app = express();
const PORT = process.env.PORT || 7001;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  logger.info(`Received ${req.method} request to ${req.url}`);
  logger.info(`Request body ${req.body}`);
  next();
});

// DDOS Protection and Rate Limit
const rateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'middelware',
  points: 10,
  duration: 1,
});

app.use((req, res, next) => {
  rateLimiter
    .consume(req.ip)
    .then(() => next())
    .catch(() => {
      logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
      res.status(429).json({
        success: false,
        message: 'Too many requests!',
      });
    });
});

// IP based rate limiting for sensitive enpoints
const sensitiveEndpointsLimits = rateLimit({
  windowMs: 15 * 60 * 1000, // 15mins
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Sensitive enpoint rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Too many requests!',
    });
  },
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
  }),
});

// apply this sensitiveEndpointsLimiter to our routes
app.use('/api/auth/register', sensitiveEndpointsLimits);

// Routes
app.use('/api/auth', routes);

// Error Handler
app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`Auth service running on ${PORT}`);
});

// Undhandled promise rejection handler
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at', promise, 'reason:', reason);
});
 