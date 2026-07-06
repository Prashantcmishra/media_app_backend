const express = require("express");
const protect = require("../middleware/auth");
const { uploadVideo } = require("../middleware/upload");
const uploadBufferToCloudinary = require("../utils/cloudinaryUpload");
const Video = require("../models/Video");

const router = express.Router();

// GET /api/videos - fetch all videos from DB (protected)
router.get("/", protect, async (req, res) => {
  try {
    const videos = await Video.find().sort({ createdAt: -1 });
    res.status(200).json(videos);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch videos", error: err.message });
  }
});

// POST /api/videos/upload - upload a single video (protected)
router.post("/upload", protect, uploadVideo.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No video file provided" });
    }

    const result = await uploadBufferToCloudinary(req.file.buffer, "video", "media-app/videos");

    const newVideo = await Video.create({
      url: result.secure_url,
      publicId: result.public_id,
      originalName: req.file.originalname,
      uploadedBy: req.user.username,
    });

    res.status(201).json(newVideo);
  } catch (err) {
    res.status(500).json({ message: "Video upload failed", error: err.message });
  }
});

module.exports = router;
