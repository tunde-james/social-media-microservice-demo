const Media = require('../models/media-model');
const { uploadMediaToCloudinary } = require('../utils/cloudinary');
const logger = require('../utils/logger');

const uploadMediaController = async (req, res) => {
  logger.info('Starting media upload');
  try {
    console.log(req.file, 'req.filereq.file');

    if (!req.file) {
      logger.error('No file found. Please add a file and try again!');
      return res.status(400).json({
        success: false,
        message: 'No file found. Please add a file and try again!',
      });
    }

    const { originalname, mimetype, buffer } = req.file;
    const userId = req.user.userId;

    logger.info(`File details: name=${originalname}, type=${mimetype}`);
    logger.info('Uploading to cloudinary starting...');

    const cloudinaryUploadResult = await uploadMediaToCloudinary(req.file);
    logger.info(
      `Cloudinary upload successful. Public Id: - ${cloudinaryUploadResult.public_id}`
    );

    const newlyCreatedMedia = new Media({
      publicId: cloudinaryUploadResult.public_id,
      originalName: originalname,
      mimeType: mimetype,
      url: cloudinaryUploadResult.secure_url,
      userId,
    });

    await newlyCreatedMedia.save();

    res.status(201).json({
      success: true,
      mediaId: newlyCreatedMedia._id,
      url: newlyCreatedMedia.url,
      message: 'Media upload is successful',
    });
  } catch (error) {
    logger.error('Error creating media', error);
    res.status(500).json({
      success: false,
      message: 'Error creating media',
    });
  }
};

const getAllMediaController = async (req, res) => {
  try {
    const allMedia = await Media.find({});

    res.json({ allMedia });
  } catch (error) {
    logger.error('Error fetching all media', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching all media',
    });
  }
};

module.exports = { uploadMediaController, getAllMediaController };
