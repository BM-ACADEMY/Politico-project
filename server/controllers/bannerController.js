// controllers/bannerController.js
const Banner = require("../models/bannerimages"); // Assuming Banner model is in models/Banner.js
const { processFile, deleteFile } = require("../utils/upload"); // Import processFile and deleteFile from upload middleware
const auth = require("../middleware/auth"); // Import auth middleware
const path = require("path");

// Create a new banner with image upload
const createBanner = async (req, res) => {
  try {
    // Check if user is authenticated (via auth middleware)
    const userId = req.user.id || req.user._id;

    // Handle single image upload (using multer from upload middleware)
    if (!req.file) {
      return res.status(400).json({ message: "Image is required" });
    }

    // Process the uploaded image (entityType: "banners")
    const fileName = `banner_${Date.now()}_${path.extname(req.file.originalname)}`;
    const imageUrl = await processFile(
      req.file.buffer,
      req.file.mimetype,
      "banners", // entityType for banners folder
      fileName
    );

    // Create banner document
    const newBanner = new Banner({
      image: imageUrl,
      createdBy: userId,
    });

    await newBanner.save();

    res.status(201).json({
      success: true,
      message: "Banner created successfully",
      data: newBanner,
    });
  } catch (error) {
    console.error("Error creating banner:", error);
    res.status(500).json({
      success: false,
      message: "Server error while creating banner",
      error: error.message,
    });
  }
};

// Get all banners (public or protected) - FIXED: Filter by current user to show only user's own banners
const getBanners = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const banners = await Banner.find({ createdBy: userId })
      .populate("createdBy", "name email") // Optional: populate user info
      .sort({ createdAt: -1 }); // Latest first

    res.status(200).json({
      success: true,
      message: "Banners fetched successfully",
      data: banners,
    });
  } catch (error) {
    console.error("Error fetching banners:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching banners",
      error: error.message,
    });
  }
};

// Get a single banner by ID
const getBannerById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id || req.user._id;
    const banner = await Banner.findOne({ _id: id, createdBy: userId }).populate("createdBy", "name email");

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: "Banner not found or unauthorized",
      });
    }

    res.status(200).json({
      success: true,
      message: "Banner fetched successfully",
      data: banner,
    });
  } catch (error) {
    console.error("Error fetching banner:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching banner",
      error: error.message,
    });
  }
};

// Update banner (with optional image re-upload)
const updateBanner = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { id } = req.params;

    // Find existing banner and check ownership
    const existingBanner = await Banner.findOne({ _id: id, createdBy: userId });
    if (!existingBanner) {
      return res.status(404).json({
        success: false,
        message: "Banner not found or unauthorized",
      });
    }

    // Handle optional image update
    let imageUrl = existingBanner.image;
    if (req.file) {
      // Delete old image if exists
      deleteFile(imageUrl);

      // Process new image
      const fileName = `banner_${Date.now()}_${path.extname(req.file.originalname)}`;
      imageUrl = await processFile(
        req.file.buffer,
        req.file.mimetype,
        "banners",
        fileName
      );
    }

    // Update banner
    const updatedBanner = await Banner.findByIdAndUpdate(
      id,
      { image: imageUrl, ...req.body },
      { new: true, runValidators: true }
    ).populate("createdBy", "name email");

    res.status(200).json({
      success: true,
      message: "Banner updated successfully",
      data: updatedBanner,
    });
  } catch (error) {
    console.error("Error updating banner:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating banner",
      error: error.message,
    });
  }
};

// Delete banner by ID
const deleteBanner = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { id } = req.params;

    const banner = await Banner.findOneAndDelete({ _id: id, createdBy: userId });
    if (!banner) {
      return res.status(404).json({
        success: false,
        message: "Banner not found or unauthorized",
      });
    }

    // Delete associated image
    deleteFile(banner.image);

    res.status(200).json({
      success: true,
      message: "Banner deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting banner:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting banner",
      error: error.message,
    });
  }
};

module.exports = {
  createBanner,
  getBanners,
  getBannerById,
  updateBanner,
  deleteBanner,
};