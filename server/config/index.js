/**
 * Configuration module for the image generation server
 * Centralizes all constants, API URLs, and default parameters
 */

require("dotenv").config();

/**
 * Server configuration
 */
const server = {
  port: process.env.PORT || 3000,
  host: "0.0.0.0",
  requestLimit: "50mb",
};

/**
 * API endpoints configuration
 */
const api = {
  imageGeneration: "https://image.chutes.ai/generate",
  zImageGeneration: "https://chutes-z-image-turbo.chutes.ai/generate",
  imageEdit: "https://chutes-qwen-image-edit-2511.chutes.ai/generate",
  videoGeneration: "https://chutes-wan-2-2-i2v-14b-fast.chutes.ai/generate",
  analyzeImage: "https://llm.chutes.ai/v1/chat/completions",
  speak: "https://chutes-kokoro.chutes.ai/speak",
  token: process.env.CHUTES_API_TOKEN,
};

/**
 * Default model parameters for different task types
 */
const defaults = {
  generate: {
    model: "qwen-image",
    guidance_scale: 7.5,
    width: 1024,
    height: 1024,
    num_inference_steps: 20,
  },
  zimage: {
    width: 1024,
    height: 1024,
    num_inference_steps: 4,
  },
  edit: {
    width: 1024,
    height: 1024,
    num_inference_steps: 40,
    true_cfg_scale: 4,
    negative_prompt: "",
  },
  video: {
    negative_prompt: "",
    fps: 16,
    resolution: "480p",
    frames: 81,
  },
  analyzeImage: {
    prompt: "Describe this image",
    model: "Qwen/Qwen3-VL-235B-A22B-Instruct",
    max_tokens: 1024,
    temperature: 0.7,
  },
  speak: {
    voice: "af_heart",
    speed: 1.0,
  },
};

/**
 * Queue configuration
 */
const queue = {
  concurrency: 10,
  timeoutMinutes: 10,
  cleanupIntervalMinutes: 5,
};

/**
 * File paths configuration
 */
const paths = {
  inputs: "inputs",
  outputs: "outputs",
  queueFile: "queue.txt",
  database: "database.sqlite",
};

/**
 * Task types and their corresponding file extensions
 */
const taskExtensions = {
  video: "mp4",
  "analyze-image": "txt",
  speak: "wav",
  generate: "png",
  zimage: "png",
  edit: "png",
};

/**
 * Task status values
 */
const taskStatus = {
  pending: "pending",
  processing: "processing",
  completed: "completed",
  failed: "failed",
};

/**
 * HTTP status codes
 */
const httpStatus = {
  OK: 200,
  ACCEPTED: 202,
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
};

/**
 * Error messages
 */
const errorMessages = {
  promptRequired: "Prompt is required",
  imageRequired: "Input image is required",
  imageOrUrlRequired: "Image (base64 or filename) or image_url is required",
  atLeastOneImageRequired: "At least one image is required",
  textRequired: "Text is required",
  invalidBase64Image: "Invalid base64 image data",
  taskNotFound: "Task not found",
  inputImageNotFound: (name) => `Input image not found: ${name}`,
  noImageSource: "No image source provided for analysis",
};

/**
 * Success messages
 */
const successMessages = {
  taskQueued: "Task queued successfully",
  zImageTaskQueued: "Z-Image task queued successfully",
  editTaskQueued: "Edit task queued successfully",
  videoTaskQueued: "Video generation task queued successfully",
  analyzeTaskQueued: "Analyze image task queued successfully",
  speakTaskQueued: "Speak task queued successfully",
  taskDeleted: "Task deleted successfully",
  cleanupCompleted: (count) =>
    `Cleanup completed. ${count} tasks were marked as failed.`,
};

module.exports = {
  server,
  api,
  defaults,
  queue,
  paths,
  taskExtensions,
  taskStatus,
  httpStatus,
  errorMessages,
  successMessages,
};
