const mongoose = require("mongoose");

const imageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    originalName: { type: String },
    uploadedBy: { type: String, default: "admin" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Image", imageSchema);
