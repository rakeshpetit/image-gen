/**
 * Task service - handles task creation and management
 */

const { v4: uuidv4 } = require("uuid");
const { createTask, getTask, getAllTasks, deleteTask } = require("../db");
const { addTaskToQueue } = require("../queue");
const { defaults, successMessages, httpStatus } = require("../config");
const { saveBase64Image } = require("../utils/fileUtils");
const {
  validatePrompt,
  validateImage,
  validateImagesArray,
  validateImageOrUrl,
  validateText,
} = require("../utils/validation");

/**
 * Create a new image generation task
 * @param {Object} data - Task data
 * @param {string} data.prompt - The prompt for image generation
 * @param {string} data.model - The model to use
 * @param {number} data.guidance_scale - Guidance scale
 * @param {number} data.width - Image width
 * @param {number} data.height - Image height
 * @param {number} data.num_inference_steps - Number of inference steps
 * @returns {Object} Task creation result
 */
function createGenerateTask(data) {
  const { prompt, model, guidance_scale, width, height, num_inference_steps } =
    data;

  validatePrompt(prompt);

  const id = uuidv4();
  const options = {
    prompt,
    model: model || defaults.generate.model,
    guidance_scale: guidance_scale || defaults.generate.guidance_scale,
    width: width || defaults.generate.width,
    height: height || defaults.generate.height,
    num_inference_steps:
      num_inference_steps || defaults.generate.num_inference_steps,
    type: "generate",
  };

  createTask(id, prompt, options);
  addTaskToQueue(id, options);

  return {
    id,
    status: "pending",
    message: successMessages.taskQueued,
  };
}

/**
 * Create a new z-image generation task
 * @param {Object} data - Task data
 * @param {string} data.prompt - The prompt for image generation
 * @param {number} data.width - Image width
 * @param {number} data.height - Image height
 * @param {number} data.num_inference_steps - Number of inference steps
 * @returns {Object} Task creation result
 */
function createZImageTask(data) {
  const { prompt, width, height, num_inference_steps } = data;

  validatePrompt(prompt);

  const id = uuidv4();
  const options = {
    prompt,
    width: width || defaults.zimage.width,
    height: height || defaults.zimage.height,
    num_inference_steps:
      num_inference_steps || defaults.zimage.num_inference_steps,
    type: "zimage",
  };

  createTask(id, prompt, options);
  addTaskToQueue(id, options);

  return {
    id,
    status: "pending",
    message: successMessages.zImageTaskQueued,
  };
}

/**
 * Create a new image editing task
 * @param {Object} data - Task data
 * @param {string} data.prompt - The prompt for image editing
 * @param {string[]} data.images - Array of image filenames
 * @param {number} data.width - Image width
 * @param {number} data.height - Image height
 * @param {number} data.num_inference_steps - Number of inference steps
 * @param {number} data.true_cfg_scale - True CFG scale
 * @param {string} data.negative_prompt - Negative prompt
 * @returns {Object} Task creation result
 */
function createEditTask(data) {
  const {
    prompt,
    images,
    width,
    height,
    num_inference_steps,
    true_cfg_scale,
    negative_prompt,
  } = data;

  validatePrompt(prompt);
  validateImagesArray(images);

  const id = uuidv4();
  const options = {
    prompt,
    images,
    width: width || defaults.edit.width,
    height: height || defaults.edit.height,
    num_inference_steps:
      num_inference_steps || defaults.edit.num_inference_steps,
    true_cfg_scale: true_cfg_scale || defaults.edit.true_cfg_scale,
    negative_prompt: negative_prompt || defaults.edit.negative_prompt,
    type: "edit",
  };

  createTask(id, prompt, options);
  addTaskToQueue(id, options);

  return {
    id,
    status: "pending",
    message: successMessages.editTaskQueued,
  };
}

/**
 * Create a new video generation task
 * @param {Object} data - Task data
 * @param {string} data.prompt - The prompt for video generation
 * @param {string} data.image - Input image filename
 * @param {string} data.negative_prompt - Negative prompt
 * @param {number} data.fps - Frames per second
 * @param {string} data.resolution - Video resolution
 * @param {number} data.frames - Number of frames
 * @returns {Object} Task creation result
 */
function createVideoTask(data) {
  const { prompt, image, negative_prompt, fps, resolution, frames } = data;

  validatePrompt(prompt);
  validateImage(image);

  const id = uuidv4();
  const options = {
    prompt,
    image,
    negative_prompt: negative_prompt || defaults.video.negative_prompt,
    fps: fps || defaults.video.fps,
    resolution: resolution || defaults.video.resolution,
    frames: frames || defaults.video.frames,
    type: "video",
  };

  createTask(id, prompt, options);
  addTaskToQueue(id, options);

  return {
    id,
    status: "pending",
    message: successMessages.videoTaskQueued,
  };
}

/**
 * Create a new image analysis task
 * @param {Object} data - Task data
 * @param {string} data.prompt - The prompt for image analysis
 * @param {string} data.image - Base64 image or filename
 * @param {string} data.image_url - Image URL
 * @returns {Object} Task creation result
 */
function createAnalyzeTask(data) {
  const { prompt, image, image_url } = data;

  validateImageOrUrl(image, image_url);

  const id = uuidv4();
  let finalImage = image;

  // If image is base64, save it to inputs/
  if (image && image.startsWith("data:image")) {
    finalImage = saveBase64Image(image);
  }

  const options = {
    prompt: prompt || defaults.analyzeImage.prompt,
    image: finalImage,
    image_url: image_url,
    type: "analyze-image",
  };

  createTask(id, prompt || defaults.analyzeImage.prompt, options);
  addTaskToQueue(id, options);

  return {
    id,
    status: "pending",
    message: successMessages.analyzeTaskQueued,
  };
}

/**
 * Create a new text-to-speech task
 * @param {Object} data - Task data
 * @param {string} data.text - The text to convert to speech
 * @param {string} data.voice - Voice to use
 * @param {number} data.speed - Speech speed
 * @returns {Object} Task creation result
 */
function createSpeakTask(data) {
  const { text, voice, speed } = data;

  validateText(text);

  const id = uuidv4();
  const options = {
    text,
    voice: voice || defaults.speak.voice,
    speed: speed || defaults.speak.speed,
    type: "speak",
  };

  createTask(id, text, options);
  addTaskToQueue(id, options);

  return {
    id,
    status: "pending",
    message: successMessages.speakTaskQueued,
  };
}

/**
 * Get a task by ID
 * @param {string} id - Task ID
 * @returns {Object|null} Task object or null if not found
 */
function getTaskById(id) {
  return getTask(id);
}

/**
 * Get all tasks, optionally filtered by status
 * @param {string} status - Optional status filter
 * @returns {Array} Array of tasks
 */
function getAllTasksByStatus(status) {
  return getAllTasks(status);
}

/**
 * Delete a task
 * @param {string} id - Task ID
 * @returns {Object} Deletion result
 */
function deleteTaskById(id) {
  const task = getTask(id);

  if (!task) {
    return null;
  }

  deleteTask(id);

  return {
    message: successMessages.taskDeleted,
  };
}

module.exports = {
  createGenerateTask,
  createZImageTask,
  createEditTask,
  createVideoTask,
  createAnalyzeTask,
  createSpeakTask,
  getTaskById,
  getAllTasksByStatus,
  deleteTaskById,
};
