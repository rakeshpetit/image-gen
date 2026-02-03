/**
 * File utility functions
 */

const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const { paths, errorMessages } = require("../config");

/**
 * Save a base64 image to the inputs directory
 * @param {string} base64String - The base64 encoded image string
 * @returns {string} The filename of the saved image
 * @throws {Error} If the base64 string is invalid
 */
function saveBase64Image(base64String) {
  if (!base64String || !base64String.startsWith("data:image")) {
    throw new Error(errorMessages.invalidBase64Image);
  }

  const base64Data = base64String.replace(/^data:image\/\w+;base64,/, "");
  const buffer = Buffer.from(base64Data, "base64");
  const extension = base64String.split(";")[0].split("/")[1] || "png";
  const filename = `input_${uuidv4()}.${extension}`;
  const filepath = path.join(__dirname, "..", paths.inputs, filename);
  fs.writeFileSync(filepath, buffer);
  return filename;
}

/**
 * Delete a file if it exists
 * @param {string} filepath - The path to the file to delete
 * @returns {boolean} True if the file was deleted, false otherwise
 */
function deleteFile(filepath) {
  if (fs.existsSync(filepath)) {
    try {
      fs.unlinkSync(filepath);
      return true;
    } catch (err) {
      console.error(`Error deleting file: ${filepath}`, err);
      return false;
    }
  }
  return false;
}

/**
 * Read an image file and return its base64 representation
 * @param {string} filename - The filename of the image in the inputs directory
 * @returns {string} The base64 encoded image
 * @throws {Error} If the file doesn't exist
 */
function readImageAsBase64(filename) {
  const imagePath = path.join(__dirname, "..", paths.inputs, filename);
  if (!fs.existsSync(imagePath)) {
    throw new Error(errorMessages.inputImageNotFound(filename));
  }
  const imageBuffer = fs.readFileSync(imagePath);
  return imageBuffer.toString("base64");
}

/**
 * Read an image file and return its base64 representation with data URI prefix
 * @param {string} filename - The filename of the image in the inputs directory
 * @returns {string} The base64 encoded image with data URI prefix
 * @throws {Error} If the file doesn't exist
 */
function readImageAsDataUrl(filename) {
  const imagePath = path.join(__dirname, "..", paths.inputs, filename);
  if (!fs.existsSync(imagePath)) {
    throw new Error(errorMessages.inputImageNotFound(filename));
  }
  const imageBuffer = fs.readFileSync(imagePath);
  const base64Image = imageBuffer.toString("base64");
  const ext = path.extname(filename).toLowerCase().replace(".", "");
  const mimeType = `image/${ext === "jpg" ? "jpeg" : ext}`;
  return `data:${mimeType};base64,${base64Image}`;
}

/**
 * Check if a file exists
 * @param {string} filepath - The path to check
 * @returns {boolean} True if the file exists, false otherwise
 */
function fileExists(filepath) {
  return fs.existsSync(filepath);
}

/**
 * Get the full path to a file in a specific directory
 * @param {string} directory - The directory name (e.g., 'inputs', 'outputs')
 * @param {string} filename - The filename
 * @returns {string} The full path
 */
function getFilePath(directory, filename) {
  return path.join(__dirname, "..", directory, filename);
}

module.exports = {
  saveBase64Image,
  deleteFile,
  readImageAsBase64,
  readImageAsDataUrl,
  fileExists,
  getFilePath,
};
