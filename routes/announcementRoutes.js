const express = require("express");
const protect = require("../middleware/auth");
const Announcement = require("../models/Announcement");

const router = express.Router();

// GET /api/announcement - any logged-in user (admin, user1, user2) can view the current message
router.get("/", protect, async (req, res) => {
  try {
    const announcement = await Announcement.findOne().sort({ updatedAt: -1 });
    res.status(200).json({ message: announcement ? announcement.message : "" });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch announcement", error: err.message });
  }
});

// POST /api/announcement - admin only, create/update the single shared announcement
router.post("/", protect, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Only admin can update the announcement" });
    }

    const { message } = req.body;
    if (typeof message !== "string") {
      return res.status(400).json({ message: "Message text is required" });
    }

    const announcement = await Announcement.findOneAndUpdate(
      {},
      { message: message.trim(), updatedBy: req.user.username },
      { new: true, upsert: true }
    );

    res.status(200).json({ message: announcement.message });
  } catch (err) {
    res.status(500).json({ message: "Failed to update announcement", error: err.message });
  }
});

module.exports = router;