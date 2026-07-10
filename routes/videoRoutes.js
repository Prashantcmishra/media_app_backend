const express = require("express");
const protect = require("../middleware/auth");
const { uploadVideo } = require("../middleware/upload");
const uploadBufferToCloudinary = require("../utils/cloudinaryUpload");
const cloudinary = require("../config/cloudinary");
const Video = require("../models/Video");
const { getPeerUsernames } = require("../config/users");

const router = express.Router();

// GET /api/videos - fetch videos from DB (protected)
// Admin sees everyone's videos. A "user" role account sees the SHARED pool
// uploaded by any "user" role account (e.g. user1 and user2 see each other's uploads),
// but not admin's own uploads.
router.get("/", protect, async (req, res) => {
  try {
    const filter =
      req.user.role === "admin" ? {} : { uploadedBy: { $in: getPeerUsernames() } };
    const videos = await Video.find(filter).sort({ createdAt: -1 });
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

// DELETE /api/videos/:id - delete video from Cloudinary + DB (protected)
router.delete("/:id", protect, async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }

    if (req.user.role !== "admin" && video.uploadedBy !== req.user.username) {
      return res.status(403).json({ message: "You can only delete your own videos" });
    }

    await cloudinary.uploader.destroy(video.publicId, { resource_type: "video" });
    await video.deleteOne();

    res.status(200).json({ message: "Video deleted", id: req.params.id });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete video", error: err.message });
  }
});

// POST /api/videos/:id/react - add an emoji reaction + optional short comment (protected)
const ALLOWED_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "😡"];

router.post("/:id/react", protect, async (req, res) => {
  try {
    const { emoji, comment } = req.body;

    if (!emoji || !ALLOWED_EMOJIS.includes(emoji)) {
      return res.status(400).json({ message: "Invalid or missing emoji" });
    }

    const video = await Video.findById(req.params.id);
    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }

    if (
      req.user.role !== "admin" &&
      !getPeerUsernames().includes(video.uploadedBy)
    ) {
      return res.status(403).json({ message: "You can only react to videos in your shared pool" });
    }

    const reaction = {
      emoji,
      comment: (comment || "").slice(0, 200),
      username: req.user.username,
    };

    video.reactions.push(reaction);
    await video.save();

    res.status(201).json(video);
  } catch (err) {
    res.status(500).json({ message: "Failed to add reaction", error: err.message });
  }
});

module.exports = router;