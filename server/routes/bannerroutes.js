// routes/bannerroutes.js (or whatever the file is named)
const express = require("express");
const router = express.Router();
const multer = require("multer");
const auth = require("../middleware/auth"); // Import auth middleware
const {
  createBanner,
  getBanners,
  getBannerById,
  updateBanner,
  deleteBanner,
} = require("../controllers/bannerController");

// Configure multer for memory storage (since controller uses req.file.buffer)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Protected routes - Apply auth to all routes since banners are user-specific
router.get("/", auth, getBanners);
router.get("/:id", auth, getBannerById);
router.post("/", auth, upload.single("image"), createBanner); // Note: field name is 'image' based on frontend
router.put("/:id", auth, upload.single("image"), updateBanner);
router.delete("/:id", auth, deleteBanner);

module.exports = router;