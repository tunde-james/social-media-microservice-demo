const SearchPost = require('../models/search-post-model');
const logger = require('../utils/logger');

const handlePostCreated = async (event) => {
  try {
    const newSearchPost = new SearchPost({
      postId: event.postId,
      userId: event.userId,
      content: event.content,
      createdAt: event.createdAt,
    });

    await newSearchPost.save();

    logger.info(
      `Search post created: ${event.postId}, ${newSearchPost._id.toString()}`
    );
  } catch (error) {
    logger.error(error, 'Error handling post creation event');
  }
};

const handlePostDeleted = async (event) => {
  try {
    await SearchPost.findOneAndDelete({ postId: event.postId });

    logger.info(`Search post deleted: ${event.postId}`);
  } catch (error) {
    logger.error(error, 'Error handling post delete event');
  }
};

module.exports = { handlePostCreated, handlePostDeleted };
