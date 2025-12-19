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

module.exports = {
  createTask,
  updateTaskStatus,
  getTask,
};
