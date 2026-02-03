/**
 * Upload controller - handles image upload endpoints
 */

const { saveBase64Image } = require("../utils/fileUtils");
const { httpStatus } = require("../config");

/**
 * Handle image upload
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
function uploadImage(req, res) {
  const { image } = req.body;

  if (!image) {
    return res.status(httpStatus.BAD_REQUEST).json({
      error: "Image data is required",
    });
  }

  try {
    const filename = saveBase64Image(image);
    res.json({ filename });
  } catch (err) {
    res.status(httpStatus.BAD_REQUEST).json({ error: err.message });
  }
}

module.exports = {
  uploadImage,
};
