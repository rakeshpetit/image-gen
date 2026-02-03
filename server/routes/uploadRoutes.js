/**
 * Upload routes - handles image upload endpoints
 */

const express = require("express");
const router = express.Router();
const { uploadImage } = require("../controllers/uploadController");

/**
 * @route   POST /upload
 * @desc    Upload a base64 image
 * @access  Public
 */
router.post("/upload", uploadImage);

module.exports = router;
