const express = require("express");
const protect = require("../middleware/auth");
const { uploadImage } = require("../middleware/upload");
const uploadBufferToCloudinary = require("../utils/cloudinaryUpload");
const Image = require("../models/Image");

const router = express.Router();

// GET /api/images - fetch all images from DB (protected)
router.get("/", protect, async (req, res) => {
  try {
    const images = await Image.find().sort({ createdAt: -1 });
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

module.exports = router;
