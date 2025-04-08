const SearchPost = require('../models/search-post-model');
const logger = require('../utils/logger');

const searchPostController = async (req, res) => {
  logger.info('Search endpoint hit!');
  try {
    const { query } = req.query;

    // const cachedKey = `post:${query}`;
    // const cachedPosts = await redisClient.get(cachedKey);
    // if (cachedPosts) {
    //   return res.json(JSON.parse(cachedPosts));
    // }

    const postResults = await SearchPost.find(
      {
        $text: { $search: query },
      },
      {
        score: { $meta: 'textScore' },
      }
    )
      .sort({ score: { $meta: 'textScore' } })
      .limit(10);

    // await req.redisClient.setex(cachedPosts, 3600, JSON.stringify(postResults));

    res.json(postResults);
  } catch (error) {
    logger.error('Error while searching post', error);
    res.status(500).json({
      success: false,
      message: 'Error while searching post',
    });
  }
};

module.exports = { searchPostController };
