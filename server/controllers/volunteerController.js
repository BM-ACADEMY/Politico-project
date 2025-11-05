// controllers/volunteerController.js (Updated getVolunteers with role-based filtering)
const Volunteer = require("../models/Volunteer");
const Ward = require("../models/ward");
const User = require("../models/usermodel");
const Role = require("../models/role");
const bcrypt = require("bcryptjs");

const createVolunteer = async (req, res) => {
  try {
    const { name, email, password, ward, localities, phoneNumber } = req.body;

    // Validate required fields
    if (!name || !email || !password || !ward || !Array.isArray(localities) || localities.length === 0 || !phoneNumber) {
      return res.status(400).json({ message: "All fields are required, including at least one locality." });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already in use." });
    }

    // Validate ward
    const wardExists = await Ward.findById(ward);
    if (!wardExists) {
      return res.status(404).json({ message: "Ward not found." });
    }

    // Validate localities
    const invalidLocality = localities.find(loc => !wardExists.localities.includes(loc));
    if (invalidLocality) {
      return res.status(400).json({ message: `Locality "${invalidLocality}" does not belong to this ward.` });
    }

    // Find Volunteer Role (fixed: singular "volunteer")
    const volunteerRole = await Role.findOne({ name: "volunteers" });
    if (!volunteerRole) {
      return res.status(500).json({ message: "Volunteer role not found in the system." });
    }

    // Create User → Let pre("save") hook hash it (DO NOT pass hashed password)
    const newUser = await User.create({
      name,
      email,
      phone: phoneNumber,
      password: password, // ← Plain password → gets hashed by pre("save")
      role_id: volunteerRole._id,
      created_by: req.user.id,
    });

    // Hash password for Volunteer
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create Volunteer
    const newVolunteer = await Volunteer.create({
      name,
      email,
      password: hashedPassword, // ← Already hashed
      ward,
      localities,
      phoneNumber,
      created_by: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: "Volunteer created successfully",
      volunteer: newVolunteer,
      user: newUser,
    });
  } catch (error) {
    console.error("Create Volunteer Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ Get all Volunteers (optionally filter by ward) - Updated: Role-based access (admins see all, others see only their own)
const getVolunteers = async (req, res) => {
  try {
    const { ward } = req.query;

    // Base filter for ward if provided
    let filter = {};
    if (ward) {
      filter.ward = ward;
    }

    // Role-based filtering: Admins see all, others see only their created volunteers
    const userWithRole = await User.findById(req.user.id).populate("role_id", "name");
    if (!userWithRole || userWithRole.role_id.name !== "admin") {
      filter.created_by = req.user.id;
    }

    const volunteers = await Volunteer.find(filter)
      .populate("ward", "ward_name ward_number") // Fixed: use correct field names
      .populate("created_by", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json(volunteers);
  } catch (error) {
    console.error("Get Volunteers Error:", error);
    res.status(500).json({ message: "Failed to fetch volunteers.", error: error.message });
  }
};

// ✅ Get single Volunteer by ID - Updated: Role-based access check
const getVolunteerById = async (req, res) => {
  try {
    const volunteer = await Volunteer.findById(req.params.id)
      .populate("ward", "ward_name ward_number") // Fixed: use correct field names
      .populate("created_by", "name email");

    if (!volunteer) return res.status(404).json({ message: "Volunteer not found." });

    // Role-based access: Only allow if admin or creator
    const userWithRole = await User.findById(req.user.id).populate("role_id", "name");
    const isAdmin = userWithRole && userWithRole.role_id.name === "admin";
    if (!isAdmin && volunteer.created_by.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied. You can only view your own volunteers." });
    }

    res.status(200).json(volunteer);
  } catch (error) {
    console.error("Get Volunteer Error:", error);
    res.status(500).json({ message: "Failed to fetch volunteer.", error: error.message });
  }
};

// ✅ Update Volunteer - FIXED: Sync User & Volunteer, Handle Email/Password Changes
const updateVolunteer = async (req, res) => {
  try {
    const { name, email, password, ward, localities, phoneNumber } = req.body;
    const volunteerId = req.params.id;

    // Find Volunteer
    const volunteer = await Volunteer.findById(volunteerId);
    if (!volunteer) {
      return res.status(404).json({ message: "Volunteer not found." });
    }

    // Role-based access: Only allow if admin or creator
    const userWithRole = await User.findById(req.user.id).populate("role_id", "name");
    const isAdmin = userWithRole && userWithRole.role_id.name === "admin";
    if (!isAdmin && volunteer.created_by.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied. You can only update your own volunteers." });
    }

    // Find corresponding User by email
    const user = await User.findOne({ email: volunteer.email });
    if (!user) {
      return res.status(404).json({ message: "Corresponding user not found." });
    }

    // If email is being updated, check uniqueness
    if (email && email !== volunteer.email) {
      const existingUser = await User.findOne({ email });
      const existingVolunteer = await Volunteer.findOne({ email });
      if (existingUser || existingVolunteer) {
        return res.status(400).json({ message: "New email already in use." });
      }
    }

    // Validate ward if provided
    if (ward && ward !== volunteer.ward.toString()) {
      const wardExists = await Ward.findById(ward);
      if (!wardExists) {
        return res.status(404).json({ message: "Ward not found." });
      }
      // Validate new localities if provided
      if (localities && Array.isArray(localities) && localities.length > 0) {
        const invalidLocality = localities.find(loc => !wardExists.localities.includes(loc));
        if (invalidLocality) {
          return res.status(400).json({ message: `Locality "${invalidLocality}" does not belong to this ward.` });
        }
      }
    }

    // Update User fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (phoneNumber) user.phone = phoneNumber;
    if (password) {
      user.password = password; // Let pre("save") hook hash it
    }
    await user.save();

    // Update Volunteer fields
    if (name) volunteer.name = name;
    if (email) volunteer.email = email;
    if (ward) volunteer.ward = ward;
    if (localities && Array.isArray(localities)) volunteer.localities = localities;
    if (phoneNumber) volunteer.phoneNumber = phoneNumber;
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      volunteer.password = hashedPassword;
    }
    await volunteer.save();

    // Re-populate after update
    const updatedVolunteer = await Volunteer.findById(volunteerId)
      .populate("ward", "ward_name ward_number")
      .populate("created_by", "name email");

    res.status(200).json({
      message: "Volunteer updated successfully.",
      volunteer: updatedVolunteer,
    });
  } catch (error) {
    console.error("Update Volunteer Error:", error);
    res.status(500).json({ message: "Failed to update volunteer.", error: error.message });
  }
};

// ✅ Delete Volunteer - FIXED: Also delete corresponding User, with role-based access
const deleteVolunteer = async (req, res) => {
  try {
    const volunteerId = req.params.id;

    // Find Volunteer
    const volunteer = await Volunteer.findById(volunteerId);
    if (!volunteer) {
      return res.status(404).json({ message: "Volunteer not found." });
    }

    // Role-based access: Only allow if admin or creator
    const userWithRole = await User.findById(req.user.id).populate("role_id", "name");
    const isAdmin = userWithRole && userWithRole.role_id.name === "admin";
    if (!isAdmin && volunteer.created_by.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied. You can only delete your own volunteers." });
    }

    // Find and delete corresponding User
    const user = await User.findOne({ email: volunteer.email });
    if (user) {
      await User.findByIdAndDelete(user._id);
    }

    // Delete Volunteer
    await Volunteer.findByIdAndDelete(volunteerId);

    res.status(200).json({ message: "Volunteer and user deleted successfully." });
  } catch (error) {
    console.error("Delete Volunteer Error:", error);
    res.status(500).json({ message: "Failed to delete volunteer.", error: error.message });
  }
};

module.exports = {
  createVolunteer,
  getVolunteers,
  getVolunteerById,
  updateVolunteer,
  deleteVolunteer,
};