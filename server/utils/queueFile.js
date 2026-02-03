/**
 * Queue file utility functions
 */

const fs = require("fs");
const path = require("path");
const { paths } = require("../config");

const QUEUE_FILE = path.join(__dirname, "..", paths.queueFile);

/**
 * Initialize the queue file if it doesn't exist
 */
function initializeQueueFile() {
  if (!fs.existsSync(QUEUE_FILE)) {
    fs.writeFileSync(QUEUE_FILE, "");
  }
}

/**
 * Add a task ID to the queue file
 * @param {string} id - The task ID to add
 */
function addToQueueFile(id) {
  fs.appendFileSync(QUEUE_FILE, `${id}\n`);
}

/**
 * Remove a task ID from the queue file
 * @param {string} id - The task ID to remove
 */
function removeFromQueueFile(id) {
  try {
    const data = fs.readFileSync(QUEUE_FILE, "utf8");
    const lines = data
      .split("\n")
      .filter((line) => line.trim() !== id && line.trim() !== "");
    fs.writeFileSync(
      QUEUE_FILE,
      lines.join("\n") + (lines.length > 0 ? "\n" : ""),
    );
  } catch (err) {
    console.error("Error updating queue file:", err);
  }
}

/**
 * Get all task IDs from the queue file
 * @returns {string[]} Array of task IDs
 */
function getQueueFileIds() {
  try {
    const data = fs.readFileSync(QUEUE_FILE, "utf8");
    return data
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
  } catch (err) {
    console.error("Error reading queue file:", err);
    return [];
  }
}

/**
 * Clear all entries from the queue file
 */
function clearQueueFile() {
  try {
    fs.writeFileSync(QUEUE_FILE, "");
  } catch (err) {
    console.error("Error clearing queue file:", err);
  }
}

// Initialize the queue file on module load
initializeQueueFile();

module.exports = {
  addToQueueFile,
  removeFromQueueFile,
  getQueueFileIds,
  clearQueueFile,
};
