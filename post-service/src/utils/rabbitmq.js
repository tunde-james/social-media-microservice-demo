const amqp = require('amqplib');
const logger = require('./logger');

let connection = null;
let channel = null;

const EXCHANGE_NAME = 'facebook_events';

const connectToRabbitMQ = async () => {
  try {
    connection = await amqp.connect(process.env.RABBITMQ_URL);
    channel = await connection.createChannel();

    await channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: false });
    logger.info('Connected to Rabbit MQ');
    return channel;
  } catch (error) {
    logger.error('Error connecting to Rabbit MQ', error);
  }
};

const publishEvent = async (routingKey, message) => {
  if (!channel) {
    await connectToRabbitMQ();
  }

  channel.publish(
    EXCHANGE_NAME,
    routingKey,
    Buffer.from(JSON.stringify(message))
  );

  logger.info(`Event published: ${routingKey}`);
};

module.exports = { connectToRabbitMQ, publishEvent };
