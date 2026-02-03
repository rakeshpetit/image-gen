/**
 * Validation utility functions
 */

const { errorMessages } = require("../config");

/**
 * Validate that a prompt is provided
 * @param {string} prompt - The prompt to validate
 * @throws {Error} If the prompt is missing
 */
function validatePrompt(prompt) {
  if (!prompt) {
    throw new Error(errorMessages.promptRequired);
  }
}

/**
 * Validate that text is provided
 * @param {string} text - The text to validate
 * @throws {Error} If the text is missing
 */
function validateText(text) {
  if (!text) {
    throw new Error(errorMessages.textRequired);
  }
}

/**
 * Validate that an image is provided
 * @param {string} image - The image to validate
 * @throws {Error} If the image is missing
 */
function validateImage(image) {
  if (!image) {
    throw new Error(errorMessages.imageRequired);
  }
}

/**
 * Validate that either an image or image_url is provided
 * @param {string} image - The image (base64 or filename)
 * @param {string} image_url - The image URL
 * @throws {Error} If neither is provided
 */
function validateImageOrUrl(image, image_url) {
  if (!image && !image_url) {
    throw new Error(errorMessages.imageOrUrlRequired);
  }
}

/**
 * Validate that images array is provided and has at least one element
 * @param {Array} images - The images array to validate
 * @throws {Error} If the array is missing or empty
 */
function validateImagesArray(images) {
  if (!images || !Array.isArray(images) || images.length === 0) {
    throw new Error(errorMessages.atLeastOneImageRequired);
  }
}

/**
 * Validate that a string is a valid base64 image
 * @param {string} base64String - The base64 string to validate
 * @returns {boolean} True if valid, false otherwise
 */
function isValidBase64Image(base64String) {
  return (
    base64String &&
    typeof base64String === "string" &&
    base64String.startsWith("data:image")
  );
}

/**
 * Validate that a value is a number and within a range
 * @param {number} value - The value to validate
 * @param {number} min - The minimum value (inclusive)
 * @param {number} max - The maximum value (inclusive)
 * @param {string} paramName - The parameter name for error messages
 * @throws {Error} If the value is invalid
 */
function validateNumberRange(value, min, max, paramName) {
  if (value !== undefined && value !== null) {
    const numValue = Number(value);
    if (isNaN(numValue)) {
      throw new Error(`${paramName} must be a number`);
    }
    if (numValue < min || numValue > max) {
      throw new Error(`${paramName} must be between ${min} and ${max}`);
    }
  }
}

/**
 * Validate that a value is a positive number
 * @param {number} value - The value to validate
 * @param {string} paramName - The parameter name for error messages
 * @throws {Error} If the value is invalid
 */
function validatePositiveNumber(value, paramName) {
  if (value !== undefined && value !== null) {
    const numValue = Number(value);
    if (isNaN(numValue) || numValue <= 0) {
      throw new Error(`${paramName} must be a positive number`);
    }
  }
}

/**
 * Validate task ID format
 * @param {string} id - The task ID to validate
 * @returns {boolean} True if valid, false otherwise
 */
function isValidTaskId(id) {
  return id && typeof id === "string" && id.length > 0;
}

module.exports = {
  validatePrompt,
  validateText,
  validateImage,
  validateImageOrUrl,
  validateImagesArray,
  isValidBase64Image,
  validateNumberRange,
  validatePositiveNumber,
  isValidTaskId,
};
