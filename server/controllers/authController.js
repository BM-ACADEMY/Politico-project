const User = require("../models/usermodel");
const Role = require("../models/role");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// ✅ Register
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

// ✅ Login
// controllers/authController.js
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

// ✅ Logout
// exports.logout = async (req, res) => {
//   res.cookie("token", "", { maxAge: 0, httpOnly: true });
//   res.status(200).json({ message: "Logged out successfully" });
// };


export const logout = async (req, res) => {
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
