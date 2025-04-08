require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const Redis = require('ioredis');
const cors = require('cors');
const helmet = require('helmet');

const postRoutes = require('./routes/post-routes');
const errorHandler = require('./middleware/error-handler');
const logger = require('./utils/logger');
const { connectToRabbitMQ } = require('./utils/rabbitmq');

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => logger.info('Connected to MongoDB'))
  .catch((error) => logger.error('MongoDB connection error', error));

const redisClient = new Redis(process.env.REDIS_URL);

const app = express();
const PORT = process.env.PORT || 7002;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  logger.info(`Received ${req.method} request to ${req.url}`);
  logger.info(`Request body ${req.body}`);
  next();
});

app.use(
  '/api/post',
  (req, res, next) => {
    req.redisClient = redisClient;
    next();
  },
  postRoutes
);

app.use(errorHandler);

const startServer = async () => {
  try {
    await connectToRabbitMQ();

    app.listen(PORT, () => {
      logger.info(`Post service running on PORT: ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to connect to server', error);
    process.exit(1);
  }
};

startServer();

// Undhandled promise rejection handler
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at', promise, 'reason:', reason);
});
