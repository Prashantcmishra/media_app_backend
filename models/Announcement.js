const mongoose = require("mongoose");

const announcementSchema = new mongoose.Schema(
  {
    message: { type: String, default: "" },
    updatedBy: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Announcement", announcementSchema);