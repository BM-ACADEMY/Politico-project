const express = require("express");
const router = express.Router();
const { register, login, logout, getUserInfo } = require("../controllers/authController");
const authMiddleware = require('../middleware/auth');

// Auth routes
router.post("/register", register);
router.post("/login", login);
router.get("/user-info", authMiddleware, getUserInfo);
router.post("/logout", authMiddleware,logout);

module.exports = router;
