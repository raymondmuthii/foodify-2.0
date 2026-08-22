const express = require("express");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const db = require("./db/database");

const router = express.Router();

// Strip the password hash before ever sending a user object back to a client
function toPublicUser(user) {
  const { password_hash, token, ...publicUser } = user;
  return publicUser;
}

function generateToken() {
  return crypto.randomBytes(32).toString("hex");
}

// ---------- POST /api/auth/signup ----------
router.post("/signup", (req, res) => {
  const { name, email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters." });
  }

  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email.toLowerCase());
  if (existing) {
    return res.status(409).json({ error: "An account with that email already exists." });
  }

  const password_hash = bcrypt.hashSync(password, 10);

  const result = db
    .prepare("INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)")
    .run(name || null, email.toLowerCase(), password_hash);

  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(result.lastInsertRowid);

  return res.status(201).json({
    message: "Account created successfully.",
    user: toPublicUser(user),
  });
});

// ---------- POST /api/auth/login ----------
router.post("/login", (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email.toLowerCase());
  if (!user) {
    return res.status(401).json({ error: "Invalid email or password." });
  }

  const passwordMatches = bcrypt.compareSync(password, user.password_hash);
  if (!passwordMatches) {
    return res.status(401).json({ error: "Invalid email or password." });
  }

  const token = generateToken();
  db.prepare("UPDATE users SET token = ? WHERE id = ?").run(token, user.id);

  const updatedUser = db.prepare("SELECT * FROM users WHERE id = ?").get(user.id);

  return res.status(200).json({
    message: "Login successful.",
    token,
    user: toPublicUser(updatedUser),
  });
});

// ---------- Middleware: require a valid token ----------
// Expected header: Authorization: Bearer <token>
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Missing or malformed Authorization header." });
  }

  const user = db.prepare("SELECT * FROM users WHERE token = ?").get(token);
  if (!user) {
    return res.status(401).json({ error: "Invalid or expired token." });
  }

  req.user = user;
  next();
}

// ---------- GET /api/auth/me (protected, proves the token works) ----------
router.get("/me", requireAuth, (req, res) => {
  return res.status(200).json({ user: toPublicUser(req.user) });
});

// ---------- POST /api/auth/logout (protected) ----------
router.post("/logout", requireAuth, (req, res) => {
  db.prepare("UPDATE users SET token = NULL WHERE id = ?").run(req.user.id);
  return res.status(200).json({ message: "Logged out successfully." });
});

module.exports = { router, requireAuth };
