const express = require("express");
const jwt = require("jsonwebtoken");

const router = express.Router();

// POST /api/auth/login
// Hardcoded credentials check (from .env) - no user DB/signup needed.
router.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required" });
  }

  const validUsername = process.env.ADMIN_USERNAME;
  const validPassword = process.env.ADMIN_PASSWORD;

  if (username !== validUsername || password !== validPassword) {
    return res.status(401).json({ message: "Invalid username or password" });
  }

  const token = jwt.sign({ username }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

  return res.status(200).json({
    message: "Login successful",
    token,
    user: { username },
  });
});

module.exports = router;
