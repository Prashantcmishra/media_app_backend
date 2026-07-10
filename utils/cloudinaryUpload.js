const streamifier = require("streamifier");
const cloudinary = require("../config/cloudinary");

/**
 * Uploads a file buffer (from multer memory storage) to Cloudinary.
 * @param {Buffer} buffer - file buffer
 * @param {"image"|"video"} resourceType - cloudinary resource type
 * @param {string} folder - cloudinary folder name
 * @returns {Promise<object>} cloudinary upload result
 */
const uploadBufferToCloudinary = (buffer, resourceType = "image", folder = "media-app") => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: resourceType,
        folder,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

module.exports = uploadBufferToCloudinary;