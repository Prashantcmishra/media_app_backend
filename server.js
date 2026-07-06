require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const imageRoutes = require("./routes/imageRoutes");
const videoRoutes = require("./routes/videoRoutes");

const app = express();

// Connect to MongoDB Atlas
connectDB();

// Allow multiple comma-separated origins (useful when testing from phone + laptop)
const normalizeOrigin = (o) => o.trim().replace(/\/+$/, ""); // trim whitespace + strip trailing slash(es)

const allowedOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:5173")
  .split(",")
  .map(normalizeOrigin)
  .filter(Boolean);

console.log("CORS allowed origins:", allowedOrigins);

app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (mobile apps, curl, Postman)
      if (!origin || allowedOrigins.includes(normalizeOrigin(origin))) {
        callback(null, true);
      } else {
        console.warn("Blocked by CORS ->", JSON.stringify(origin), "| Allowed:", allowedOrigins);
        callback(null, false); // reject the CORS headers instead of throwing -> avoids a 500
      }
    },
  })
);

app.use(express.json());

app.get("/", (req, res) => {
  res.json({ status: "OK", message: "Media App API is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/images", imageRoutes);
app.use("/api/videos", videoRoutes);

// Multer / general error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ message: err.message || "Something went wrong" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));