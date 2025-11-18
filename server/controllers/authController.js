// controllers/authController.js (Updated: OTP stored as plain text, no hashing)
const User = require("../models/usermodel");
const Role = require("../models/role");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { sendOtpEmail } = require("../utils/Email"); // Updated import

// ✅ Register (unchanged)
exports.register = async (req, res) => {
  try {
    const { name, email, phone, password, role_id } = req.body;

    // Check existing user
    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
    if (existingUser) return res.status(400).json({ message: "Email or phone already exists" });

    const user = await User.create({ name, email, phone, password, role_id });

    // Generate JWT
    const token = jwt.sign(
      { id: user._id.toString(), role: role_id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // Set cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000, // 1 day
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });

    res.status(201).json({ message: "User registered successfully", user, token });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ Login (unchanged)
exports.login = async (req, res) => {
  try {
    const { email, phone, password } = req.body;

    // Validate input
    if (!password) {
      return res.status(400).json({ message: "Password is required" });
    }
    if (!email && !phone) {
      return res.status(400).json({ message: "Email or phone is required" });
    }

    // Find user by email OR phone
    const user = await User.findOne({
      $or: [{ email }, { phone }],
    }).populate("role_id", "name");

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user._id.toString(), role: user.role_id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // Set cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });

    res.status(200).json({ 
      message: "Login successful", 
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role_id,
      },
      token 
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getUserInfo = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate("role_id", "name");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({ 
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role_id,
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Logout (unchanged)
exports.logout = async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });

    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    res.status(500).json({ message: "Logout failed" });
  }
};

// ✅ Updated: Forgot Password - Send OTP (plain text storage)
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Validate input
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Save OTP to user (plain text)
    user.otp = otp;
    user.otpExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    // Send OTP email
    await sendOtpEmail({
      email: user.email,
      name: user.name,
      otp,
    });

    res.status(200).json({ 
      message: "OTP sent to your email" 
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ New: Verify OTP (plain text comparison)
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Validate input
    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    // Find user by email
    const user = await User.findOne({ email });

    if (!user || !user.otp || !user.otpExpiry) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // Check expiry
    if (user.otpExpiry < Date.now()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    // Verify OTP (plain text comparison)
    if (user.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // Clear OTP
    user.otp = null;
    user.otpExpiry = null;
    await user.save();

    res.status(200).json({ 
      message: "OTP verified successfully" 
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ New: Reset Password after OTP (unchanged)
exports.resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    // Validate input
    if (!email || !newPassword) {
      return res.status(400).json({ message: "Email and new password are required" });
    }

    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    // Set new password (pre-save hook will hash it)
    user.password = newPassword;
    await user.save();

    res.status(200).json({ 
      message: "Password reset successfully" 
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};