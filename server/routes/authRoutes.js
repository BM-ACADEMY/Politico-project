// routes/authRoutes.js (Updated with new endpoints)
const express = require("express");
const router = express.Router();
const { register, login, logout, getUserInfo, forgotPassword, verifyOtp, resetPassword } = require("../controllers/authController");
const authMiddleware = require('../middleware/auth');

// Auth routes
router.post("/register", register);
router.post("/login", login);
router.get("/user-info", authMiddleware, getUserInfo);
router.post("/logout", authMiddleware, logout);
router.post("/forgot-password", forgotPassword);
router.post("/verify-otp", verifyOtp);
router.post("/reset-password", resetPassword);

module.exports = router;