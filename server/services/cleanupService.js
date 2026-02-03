/**
 * Cleanup service - handles task cleanup operations
 */

const { cleanupStuckTasks } = require("../db");
const { removeFromQueueFile } = require("../utils/queueFile");
const { deleteFile } = require("../utils/fileUtils");
const { successMessages } = require("../config");

/**
 * Cleanup stuck tasks
 * @param {number} timeoutMinutes - Timeout in minutes
 * @returns {Object} Cleanup result
 */
function cleanupStuck(timeoutMinutes = 10) {
  const cleanedIds = cleanupStuckTasks(timeoutMinutes);
  cleanedIds.forEach((id) => removeFromQueueFile(id));

  return {
    message: successMessages.cleanupCompleted(cleanedIds.length),
    cleanedCount: cleanedIds.length,
    cleanedIds,
  };
}

/**
 * Delete a task and its associated files
 * @param {string} id - Task ID
 * @param {Object} task - Task object
 * @returns {Object} Deletion result
 */
function deleteTaskWithFiles(id, task) {
  // Delete output file if exists
  if (task.file_path) {
    deleteFile(task.file_path);
  }

  return {
    message: successMessages.taskDeleted,
  };
}

module.exports = {
  cleanupStuck,
  deleteTaskWithFiles,
};
