const mongoose = require("mongoose");

const reactionSchema = new mongoose.Schema(
  {
    emoji: { type: String, default: "" },
    comment: { type: String, default: "", maxlength: 200 },
    username: { type: String, required: true },
  },
  { timestamps: true }
);

const imageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    originalName: { type: String },
    uploadedBy: { type: String, default: "admin" },
    reactions: { type: [reactionSchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Image", imageSchema);