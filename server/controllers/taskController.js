/**
 * Task controller - handles task-related endpoints
 */

const taskService = require("../services/taskService");
const cleanupService = require("../services/cleanupService");
const { removeFromQueueFile } = require("../utils/queueFile");
const { httpStatus } = require("../config");

/**
 * Handle image generation task creation
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
function handleGenerate(req, res) {
  try {
    const result = taskService.createGenerateTask(req.body);
    res.status(httpStatus.ACCEPTED).json(result);
  } catch (err) {
    res.status(httpStatus.BAD_REQUEST).json({ error: err.message });
  }
}

/**
 * Handle z-image generation task creation
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
function handleGenerateZImage(req, res) {
  try {
    const result = taskService.createZImageTask(req.body);
    res.status(httpStatus.ACCEPTED).json(result);
  } catch (err) {
    res.status(httpStatus.BAD_REQUEST).json({ error: err.message });
  }
}

/**
 * Handle image editing task creation
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
function handleEdit(req, res) {
  try {
    const result = taskService.createEditTask(req.body);
    res.status(httpStatus.ACCEPTED).json(result);
  } catch (err) {
    res.status(httpStatus.BAD_REQUEST).json({ error: err.message });
  }
}

/**
 * Handle video generation task creation
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
function handleGenerateVideo(req, res) {
  try {
    const result = taskService.createVideoTask(req.body);
    res.status(httpStatus.ACCEPTED).json(result);
  } catch (err) {
    res.status(httpStatus.BAD_REQUEST).json({ error: err.message });
  }
}

/**
 * Handle image analysis task creation
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
function handleAnalyzeImage(req, res) {
  try {
    const result = taskService.createAnalyzeTask(req.body);
    res.status(httpStatus.ACCEPTED).json(result);
  } catch (err) {
    res.status(httpStatus.BAD_REQUEST).json({ error: err.message });
  }
}

/**
 * Handle text-to-speech task creation
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
function handleSpeak(req, res) {
  try {
    const result = taskService.createSpeakTask(req.body);
    res.status(httpStatus.ACCEPTED).json(result);
  } catch (err) {
    res.status(httpStatus.BAD_REQUEST).json({ error: err.message });
  }
}

/**
 * Handle task status retrieval
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
function getStatus(req, res) {
  const { id } = req.params;
  const task = taskService.getTaskById(id);

  if (!task) {
    return res.status(httpStatus.NOT_FOUND).json({ error: "Task not found" });
  }

  res.json(task);
}

/**
 * Handle all tasks retrieval
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
function getAllStatuses(req, res) {
  const { status } = req.query;
  const tasks = taskService.getAllTasksByStatus(status);
  res.json(tasks);
}

/**
 * Handle task deletion
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
function deleteTask(req, res) {
  const { id } = req.params;
  const task = taskService.getTaskById(id);

  if (!task) {
    return res.status(httpStatus.NOT_FOUND).json({ error: "Task not found" });
  }

  // Delete from DB
  taskService.deleteTaskById(id);

  // Remove from Queue File
  removeFromQueueFile(id);

  // Delete output file if exists
  cleanupService.deleteTaskWithFiles(id, task);

  res.json({ message: "Task deleted successfully" });
}

/**
 * Handle manual cleanup of stuck tasks
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
function handleCleanup(req, res) {
  const { timeoutMinutes } = req.body;
  const result = cleanupService.cleanupStuck(timeoutMinutes || 10);
  res.json(result);
}

module.exports = {
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
};
