/**
 * Database module - handles all database operations
 * Refactored to use centralized configuration
 */

const Database = require("better-sqlite3");
const path = require("path");
const { paths } = require("./config");

const dbPath = path.join(__dirname, paths.database);
const db = new Database(dbPath);

// Initialize database schema
db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    prompt TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    options TEXT,
    file_path TEXT,
    error TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

/**
 * Create a new task
 * @param {string} id - Task ID
 * @param {string} prompt - Task prompt
 * @param {Object} options - Task options (will be JSON stringified)
 */
function createTask(id, prompt, options = null) {
  const stmt = db.prepare(
    "INSERT INTO tasks (id, prompt, options) VALUES (?, ?, ?)",
  );
  stmt.run(id, prompt, options ? JSON.stringify(options) : null);
}

/**
 * Update task status
 * @param {string} id - Task ID
 * @param {string} status - New status
 * @param {string} filePath - Optional file path
 * @param {string} error - Optional error message
 */
function updateTaskStatus(id, status, filePath = null, error = null) {
  const stmt = db.prepare(`
    UPDATE tasks 
    SET status = ?, file_path = ?, error = ?, updated_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `);
  stmt.run(status, filePath, error, id);
}

/**
 * Get a task by ID
 * @param {string} id - Task ID
 * @returns {Object|null} Task object or null if not found
 */
function getTask(id) {
  const stmt = db.prepare("SELECT * FROM tasks WHERE id = ?");
  return stmt.get(id);
}

/**
 * Get all tasks, optionally filtered by status
 * @param {string} status - Optional status filter
 * @returns {Array} Array of tasks
 */
function getAllTasks(status = null) {
  if (status) {
    const stmt = db.prepare(
      "SELECT * FROM tasks WHERE status = ? ORDER BY created_at DESC",
    );
    return stmt.all(status);
  }
  const stmt = db.prepare("SELECT * FROM tasks ORDER BY created_at DESC");
  return stmt.all();
}

/**
 * Cleanup stuck tasks that have been processing for too long
 * @param {number} timeoutMinutes - Timeout in minutes
 * @returns {Array} Array of task IDs that were cleaned up
 */
function cleanupStuckTasks(timeoutMinutes = 10) {
  const selectStmt = db.prepare(`
    SELECT id FROM tasks 
    WHERE status = 'processing' 
    AND datetime(updated_at) < datetime('now', '-' || ? || ' minutes')
  `);
  const stuckTasks = selectStmt.all(timeoutMinutes);
  const ids = stuckTasks.map((t) => t.id);

  if (ids.length > 0) {
    const updateStmt = db.prepare(`
      UPDATE tasks 
      SET status = 'failed', error = 'Task timed out', updated_at = CURRENT_TIMESTAMP 
      WHERE id IN (${ids.map(() => "?").join(",")})
    `);
    updateStmt.run(...ids);
  }

  return ids;
}

/**
 * Delete a task
 * @param {string} id - Task ID
 * @returns {Object} SQLite result object
 */
function deleteTask(id) {
  const stmt = db.prepare("DELETE FROM tasks WHERE id = ?");
  return stmt.run(id);
}

module.exports = {
  createTask,
  updateTaskStatus,
  getTask,
  getAllTasks,
  cleanupStuckTasks,
  deleteTask,
};
