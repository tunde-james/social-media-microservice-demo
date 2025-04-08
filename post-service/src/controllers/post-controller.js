const Post = require('../models/post-model');
const logger = require('../utils/logger');
const { publishEvent } = require('../utils/rabbitmq');
const { validateCreatePost } = require('../utils/validation');

const invalidatePostCache = async (req, input) => {
  const cachedKey = `post:${input}`;
  await req.redisClient.del(cachedKey);

  const keys = await req.redisClient.keys('posts:*');
  if (keys.length > 0) {
    await req.redisClient.del(keys);
  }
};

const createPostController = async (req, res) => {
  logger.info('Create post endpoint hit...');
  try {
    // validate post schema
    const { error } = validateCreatePost(req.body);
    if (error) {
      logger.warn('Validation error', error.details[0].message);
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const { content, mediaIds } = req.body;
    const newPost = new Post({
      user: req.user.userId,
      content,
      mediaIds: mediaIds || [],
    });

    await newPost.save();

    await publishEvent('post.created', {
      postId: newPost._id.toString(),
      userId: newPost.user.toString(),
      content: newPost.content,
      createdAt: newPost.createdAt,
    });

    await invalidatePostCache(req, newPost._id.toString());

    logger.info('Post created successfully', newPost);
    res.status(201).json({
      success: true,
      message: 'Post created successfully',
    });
  } catch (err) {
    logger.error('Error creating post', err);
    res.status(500).json({
      success: false,
      message: 'Error creating post',
    });
  }
};

const getAllPostController = async (req, res) => {
  logger.info('Get all post endpoint hit...');

  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;

    const cacheKey = `posts:${page}:${limit}`;
    const cachedPosts = await req.redisClient.get(cacheKey);
    if (cachedPosts) {
      return res.json(JSON.parse(cachedPosts));
    }

    const posts = await Post.find({})
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);

    const totalNumOfPost = await Post.countDocuments();

    const result = {
      posts,
      currentPage: page,
      totalPages: Math.ceil(totalNumOfPost / limit),
      totalPost: totalNumOfPost,
    };

    // Save posts in redis cache
    await req.redisClient.setex(cacheKey, 300, JSON.stringify(result));

    res.json(result);
  } catch (err) {
    logger.error('Error fetching all post', err);
    res.status(500).json({
      success: false,
      message: 'Error fetching all post',
    });
  }
};

const getPostController = async (req, res) => {
  logger.info('Get single post endpoint hit...');

  try {
    const postId = req.params.postId;
    const cachekey = `post:${postId}`;
    const cachedPost = await req.redisClient.get(cachekey);
    if (cachedPost) {
      return res.json(JSON.parse(cachedPost));
    }

    const singlePost = await Post.findById(postId);
    if (!singlePost) {
      return res.status(404).json({
        message: 'Post not found',
        success: false,
      });
    }

    await req.redisClient.setex(cachedPost, 3600, JSON.stringify(singlePost));

    res.json(singlePost);
  } catch (err) {
    logger.error('Error fetching post by ID', err);
    res.status(500).json({
      success: false,
      message: 'Error fetching post by ID',
    });
  }
};

const deletePostController = async (req, res) => {
  logger.info('Delete single post endpoint hit...');

  try {
    const post = await Post.findByIdAndDelete({
      _id: req.params.postId,
      user: req.user.userId,
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    // Publish post delete method
    await publishEvent('post.deleted', {
      postId: post._id.toString(),
      userId: req.user.userId,
      mediaIds: post.mediaIds,
    });

    await invalidatePostCache(req, req.params.postId);

    res.json({
      success: true,
      message: 'Post deleted successfully',
    });
  } catch (err) {
    logger.error('Error deleting post by ID', err);
    res.status(500).json({
      success: false,
      message: 'Error deleting post by ID',
    });
  }
};

module.exports = {
  createPostController,
  getAllPostController,
  getPostController,
  deletePostController,
};
