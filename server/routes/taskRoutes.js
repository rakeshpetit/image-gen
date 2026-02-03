/**
 * Task routes - handles all task-related endpoints
 */

const express = require("express");
const router = express.Router();
const {
  handleGenerate,
  handleGenerateZImage,
  handleEdit,
  handleGenerateVideo,
  handleAnalyzeImage,
  handleSpeak,
  getStatus,
  getAllStatuses,
  deleteTask,
  handleCleanup,
} = require("../controllers/taskController");

/**
 * @route   POST /generate
 * @desc    Create a new image generation task
 * @access  Public
 */
router.post("/generate", handleGenerate);

/**
 * @route   POST /generate-zimage
 * @desc    Create a new z-image generation task
 * @access  Public
 */
router.post("/generate-zimage", handleGenerateZImage);

/**
 * @route   POST /edit
 * @desc    Create a new image editing task
 * @access  Public
 */
router.post("/edit", handleEdit);

/**
 * @route   POST /generate-video
 * @desc    Create a new video generation task
 * @access  Public
 */
router.post("/generate-video", handleGenerateVideo);

/**
 * @route   POST /analyze-image
 * @desc    Create a new image analysis task
 * @access  Public
 */
router.post("/analyze-image", handleAnalyzeImage);

/**
 * @route   POST /speak
 * @desc    Create a new text-to-speech task
 * @access  Public
 */
router.post("/speak", handleSpeak);

/**
 * @route   GET /status/:id
 * @desc    Get status of a specific task
 * @access  Public
 */
router.get("/status/:id", getStatus);

/**
 * @route   GET /status
 * @desc    Get all tasks, optionally filtered by status
 * @access  Public
 */
router.get("/status", getAllStatuses);

/**
 * @route   DELETE /tasks/:id
 * @desc    Delete a task and its associated files
 * @access  Public
 */
router.delete("/tasks/:id", deleteTask);

/**
 * @route   POST /cleanup
 * @desc    Manually trigger cleanup of stuck tasks
 * @access  Public
 */
router.post("/cleanup", handleCleanup);

module.exports = router;
