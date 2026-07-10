const express = require("express");
const protect = require("../middleware/auth");
const { uploadImage } = require("../middleware/upload");
const uploadBufferToCloudinary = require("../utils/cloudinaryUpload");
const cloudinary = require("../config/cloudinary");
const Image = require("../models/Image");
const { getPeerUsernames } = require("../config/users");

const router = express.Router();

// GET /api/images - fetch images from DB (protected)
// Admin sees everyone's images. A "user" role account sees the SHARED pool
// uploaded by any "user" role account (e.g. user1 and user2 see each other's uploads),
// but not admin's own uploads.
router.get("/", protect, async (req, res) => {
  try {
    const filter =
      req.user.role === "admin" ? {} : { uploadedBy: { $in: getPeerUsernames() } };
    const images = await Image.find(filter).sort({ createdAt: -1 });
    res.status(200).json(images);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch images", error: err.message });
  }
});

// POST /api/images/upload - upload a single image (protected)
router.post("/upload", protect, uploadImage.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image file provided" });
    }

    const result = await uploadBufferToCloudinary(req.file.buffer, "image", "media-app/images");

    const newImage = await Image.create({
      url: result.secure_url,
      publicId: result.public_id,
      originalName: req.file.originalname,
      uploadedBy: req.user.username,
    });

    res.status(201).json(newImage);
  } catch (err) {
    res.status(500).json({ message: "Image upload failed", error: err.message });
  }
});

// DELETE /api/images/:id - delete image from Cloudinary + DB (protected)
router.delete("/:id", protect, async (req, res) => {
  try {
    const image = await Image.findById(req.params.id);
    if (!image) {
      return res.status(404).json({ message: "Image not found" });
    }

    if (req.user.role !== "admin" && image.uploadedBy !== req.user.username) {
      return res.status(403).json({ message: "You can only delete your own images" });
    }

    await cloudinary.uploader.destroy(image.publicId, { resource_type: "image" });
    await image.deleteOne();

    res.status(200).json({ message: "Image deleted", id: req.params.id });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete image", error: err.message });
  }
});

// POST /api/images/:id/react - add an emoji reaction, a comment, or both (protected)
const ALLOWED_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "😡"];

router.post("/:id/react", protect, async (req, res) => {
  try {
    const { emoji, comment } = req.body;
    const trimmedComment = (comment || "").trim().slice(0, 200);

    if (!emoji && !trimmedComment) {
      return res.status(400).json({ message: "Provide a reaction, a comment, or both" });
    }

    if (emoji && !ALLOWED_EMOJIS.includes(emoji)) {
      return res.status(400).json({ message: "Invalid emoji" });
    }

    const image = await Image.findById(req.params.id);
    if (!image) {
      return res.status(404).json({ message: "Image not found" });
    }

    if (
      req.user.role !== "admin" &&
      !getPeerUsernames().includes(image.uploadedBy)
    ) {
      return res.status(403).json({ message: "You can only react to images in your shared pool" });
    }

    const reaction = {
      emoji: emoji || "",
      comment: trimmedComment,
      username: req.user.username,
    };

    image.reactions.push(reaction);
    await image.save();

    res.status(201).json(image);
  } catch (err) {
    res.status(500).json({ message: "Failed to add reaction", error: err.message });
  }
});

module.exports = router;