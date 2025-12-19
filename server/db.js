const Database = require("better-sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "database.sqlite");
const db = new Database(dbPath);

// Initialize database schema
db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    prompt TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    file_path TEXT,
    error TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

function createTask(id, prompt) {
  const stmt = db.prepare("INSERT INTO tasks (id, prompt) VALUES (?, ?)");
  stmt.run(id, prompt);
}

function updateTaskStatus(id, status, filePath = null, error = null) {
  const stmt = db.prepare(`
    UPDATE tasks 
    SET status = ?, file_path = ?, error = ?, updated_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `);
  stmt.run(status, filePath, error, id);
}

function getTask(id) {
  const stmt = db.prepare("SELECT * FROM tasks WHERE id = ?");
  return stmt.get(id);
}

function getAllTasks(status = null) {
  if (status) {
    const stmt = db.prepare(
      "SELECT * FROM tasks WHERE status = ? ORDER BY created_at DESC"
    );
    return stmt.all(status);
  }
  const stmt = db.prepare("SELECT * FROM tasks ORDER BY created_at DESC");
  return stmt.all();
}

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

module.exports = {
  createTask,
  updateTaskStatus,
  getTask,
  getAllTasks,
  cleanupStuckTasks,
};
