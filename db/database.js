const path = require("path");
const { DatabaseSync } = require("node:sqlite");

// Single SQLite file living next to db.json / seeds.json.
// Uses Node's built-in node:sqlite module (Node 22.13+) — no native
// compilation, no node-gyp, no Python/C++ build tools required.
const dbPath = path.join(__dirname, "auth.db");
const db = new DatabaseSync(dbPath);

// Create the users table if it doesn't exist yet.
// - password_hash: bcrypt hash, never the plain password
// - token: the "session" token issued on login, cleared on logout
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    token TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

module.exports = db;
