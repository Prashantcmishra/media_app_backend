const express = require("express");
const jwt = require("jsonwebtoken");
const { getUsers } = require("../config/users");

const router = express.Router();

// POST /api/auth/login
router.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required" });
  }

  const matchedUser = getUsers().find(
    (u) => u.username === username && u.password === password
  );

  if (!matchedUser) {
    return res.status(401).json({ message: "Invalid username or password" });
  }

  const token = jwt.sign(
    { username: matchedUser.username, role: matchedUser.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );

  return res.status(200).json({
    message: "Login successful",
    token,
    user: { username: matchedUser.username, role: matchedUser.role },
  });
});

module.exports = router;