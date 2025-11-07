// Updated controllers/voterController.js
// Enhanced with role-based access: 
// - Admin: full access to all wards/voters
// - Candidate: access to own wards/voters
// - Volunteer: access to creator candidate's wards/voters
// Retained all existing logic (e.g., address validation, file uploads, cleanup)
// Fixed wardFilter to ObjectId consistently
// Added getVoterById with access checks
// Fix for frontend error: For unauthorized reads (getVoters, getWardsForVoter), return empty data instead of 403 to prevent crash on undefined stats.total
// Added support for created_by filter in getVoters

const Voter = require("../models/Voter");
const Ward = require("../models/ward");
const Candidate = require("../models/candidateModel");
const User = require("../models/usermodel");
const Volunteer = require("../models/Volunteer");
const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");
const { processFile, deleteFile } = require("../utils/upload");

// Helper function to get accessible candidate ID based on role
const getAccessibleCandidateId = async (userId, userEmail, roleName) => {
  if (roleName === "admin") {
    return null; // Full access
  } else if (roleName === "candidate") {
    const userCandidate = await Candidate.findOne({ created_by: userId });
    if (!userCandidate) {
      return null; // No access profile
    }
    return userCandidate._id;
  } else if (roleName === "volunteers") {
    const volunteer = await Volunteer.findOne({ email: userEmail });
    if (!volunteer) {
      return null; // No volunteer profile
    }
    const creatorCandidate = await Candidate.findOne({ created_by: volunteer.created_by });
    if (!creatorCandidate) {
      return null; // No creator candidate
    }
    return creatorCandidate._id;
  }
  return null; // Unauthorized role
};

// Helper function to return empty response for reads
const emptyVotersResponse = (res) => {
  res.status(200).json({
    success: true,
    voters: [],
    stats: { total: 0, neutral: 0, supporters: 0, opposition: 0 }
  });
};

const emptyWardsResponse = (res) => {
  res.status(200).json({ success: true, wards: [] });
};

// ✅ Create Voter (keep 403 for mutations)
const createVoter = async (req, res) => {
  try {
    const {
      name,
      fathers_name,
      dob,
      phone,
      voter_id,
      aadhar_number,
      support,
      ward: wardId,
      address: { house_no, locality, street, city, postal_code },
    } = req.body;

    // Handle file uploads
    const voterImageFile = req.files?.voter_image?.[0];
    const aadharImageFile = req.files?.aadhar_image?.[0];

    if (!voterImageFile || !aadharImageFile) {
      return res.status(400).json({ success: false, message: "Voter image and Aadhar image are required" });
    }

    // Validate ward exists
    const ward = await Ward.findById(wardId);
    if (!ward) {
      return res.status(404).json({ success: false, message: "Ward not found" });
    }

    // Role-based access check
    const user = await User.findById(req.user.id).populate("role_id", "name");
    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }
    const roleName = user.role_id.name;
    const accessibleCandidateId = await getAccessibleCandidateId(req.user.id, user.email, roleName);
    if (accessibleCandidateId === null && roleName !== "admin") {
      return res.status(403).json({ success: false, message: "Access denied: Invalid role or profile not found" });
    }

    // Check ward belongs to accessible candidate
    if (accessibleCandidateId && String(ward.candidate_id) !== String(accessibleCandidateId)) {
      return res.status(403).json({ success: false, message: "Access denied: Can only add voters to your candidate's wards" });
    }

    // Validate address locality matches ward's localities
    if (!ward.localities.includes(locality)) {
      return res.status(400).json({ success: false, message: "Locality must match ward's localities" });
    }

    // Validate address street/postal_code matches ward's address_details for the locality
    const matchingAddressDetail = ward.address_details.find(
      (detail) => detail.locality === locality && detail.street === street && detail.postal_code === postal_code
    );
    if (!matchingAddressDetail) {
      return res.status(400).json({ success: false, message: "Address details must match ward's address details for the selected locality" });
    }

    // Create voter folder: Uploads/voters/{sanitized_voter_name}/images
    const sanitizedVoterName = name.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
    const entityType = `voters/${sanitizedVoterName}`;
    const imagesDir = path.join(__dirname, "../Uploads", entityType, "images");
    fs.mkdirSync(imagesDir, { recursive: true });

    // Process voter image
    const voterImageFilename = `voter_${Date.now()}.webp`;
    const voterImagePath = await processFile(
      voterImageFile.buffer,
      voterImageFile.mimetype,
      entityType,
      voterImageFilename
    );

    // Process aadhar image
    const aadharImageFilename = `aadhar_${Date.now()}.webp`;
    const aadharImagePath = await processFile(
      aadharImageFile.buffer,
      aadharImageFile.mimetype,
      entityType,
      aadharImageFilename
    );

    const newVoter = await Voter.create({
      name,
      fathers_name,
      dob: new Date(dob),
      phone,
      voter_id: voter_id.toUpperCase(),
      voter_image: voterImagePath,
      aadhar_number,
      aadhar_image: aadharImagePath,
      support: support || 'neutral', // Default to neutral
      ward: wardId,
      address: { house_no, locality, street, city, postal_code },
      created_by: req.user.id,
    });

    // Populate ward and created_by
    await newVoter.populate("ward", "ward_name ward_number");
    await newVoter.populate("created_by", "name email");

    res.status(201).json({ success: true, message: "Voter created successfully", voter: newVoter });
  } catch (error) {
    console.error("Create Voter Error:", error);
    res.status(500).json({ success: false, message: "Error creating voter", error: error.message });
  }
};

// ✅ Get all voters (enhanced role-based filtering, return empty for unauthorized reads, added created_by filter)
const getVoters = async (req, res) => {
  try {
    // Role-based access: determine accessible wards
    const user = await User.findById(req.user.id).populate("role_id", "name");
    if (!user) {
      return emptyVotersResponse(res);
    }
    const roleName = user.role_id.name;
    const accessibleCandidateId = await getAccessibleCandidateId(req.user.id, user.email, roleName);
    let accessibleWardIds = [];
    if (accessibleCandidateId) {
      const userWards = await Ward.find({ candidate_id: accessibleCandidateId }).select("_id");
      accessibleWardIds = userWards.map((w) => w._id);
    } else if (roleName !== "admin") {
      // Unauthorized: return empty
      return emptyVotersResponse(res);
    }

    const { ward: wardFilter, support, created_by } = req.query;
    let query = {};
    if (support) {
      query.support = support;
    }
    if (created_by) {
      query.created_by = new mongoose.Types.ObjectId(created_by);
    }

    let finalQuery = { ...query };
    if (wardFilter) {
      const wardFilterObjId = new mongoose.Types.ObjectId(wardFilter);
      // For non-admins, validate wardFilter is accessible
      if (roleName !== "admin" && !accessibleWardIds.some(id => id.equals(wardFilterObjId))) {
        // For filter unauthorized, return empty instead of 403
        return emptyVotersResponse(res);
      }
      finalQuery.ward = wardFilterObjId;
    } else if (accessibleWardIds.length > 0) {
      finalQuery.ward = { $in: accessibleWardIds };
    }

    const voters = await Voter.find(finalQuery)
      .populate("ward", "ward_name ward_number")
      .populate("created_by", "name email")
      .sort({ createdAt: -1 });

    // Compute stats (total, neutral, supporters, opposition)
    const total = voters.length;
    const neutral = voters.filter(v => v.support === 'neutral').length;
    const supporters = voters.filter(v => v.support === 'supporter').length;
    const opposition = voters.filter(v => v.support === 'opposition').length;

    res.status(200).json({ 
      success: true, 
      voters, 
      stats: { total, neutral, supporters, opposition } 
    });
  } catch (error) {
    console.error("Get Voters Error:", error);
    // On server error, return empty to prevent frontend crash
    return emptyVotersResponse(res);
  }
};

// ✅ Get single voter by ID (with access check, return 404 for unauthorized)
const getVoterById = async (req, res) => {
  try {
    const voter = await Voter.findById(req.params.id)
      .populate("ward", "ward_name ward_number")
      .populate("created_by", "name email");

    if (!voter) {
      return res.status(404).json({ success: false, message: "Voter not found" });
    }

    // Role-based access check
    const user = await User.findById(req.user.id).populate("role_id", "name");
    if (!user) {
      return res.status(404).json({ success: false, message: "Voter not found" });
    }
    const roleName = user.role_id.name;
    let accessibleWardIds = [];
    if (roleName !== "admin") {
      const accessibleCandidateId = await getAccessibleCandidateId(req.user.id, user.email, roleName);
      if (!accessibleCandidateId) {
        return res.status(404).json({ success: false, message: "Voter not found" });
      }
      const wards = await Ward.find({ candidate_id: accessibleCandidateId }).select("_id");
      accessibleWardIds = wards.map(w => w._id);
    }

    // Check access
    if (roleName !== "admin" &&
        !accessibleWardIds.some(id => id.equals(voter.ward._id)) &&
        String(voter.created_by._id) !== String(req.user.id)) {
      return res.status(404).json({ success: false, message: "Voter not found" });
    }

    res.status(200).json({ success: true, voter });
  } catch (error) {
    console.error("Get Voter Error:", error);
    res.status(500).json({ success: false, message: "Error fetching voter", error: error.message });
  }
};

// ✅ Update voter (keep 403 for mutations)
const updateVoter = async (req, res) => {
  try {
    // Role-based access: determine accessible wards
    const user = await User.findById(req.user.id).populate("role_id", "name");
    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }
    const roleName = user.role_id.name;
    let accessibleWardIds = [];
    if (roleName !== "admin") {
      const accessibleCandidateId = await getAccessibleCandidateId(req.user.id, user.email, roleName);
      if (!accessibleCandidateId) {
        return res.status(403).json({ success: false, message: "Access denied: Profile not found" });
      }
      const userWards = await Ward.find({ candidate_id: accessibleCandidateId }).select("_id");
      accessibleWardIds = userWards.map((w) => w._id);
    }

    const voter = await Voter.findById(req.params.id).populate("ward");
    if (!voter) {
      return res.status(404).json({ success: false, message: "Voter not found" });
    }

    // Access check
    if (roleName !== "admin" &&
        !accessibleWardIds.some(id => id.equals(voter.ward._id)) &&
        String(voter.created_by._id) !== String(req.user.id)) {
      return res.status(403).json({ success: false, message: "Not authorized to update this voter" });
    }

    // Handle optional file updates
    if (req.files?.voter_image?.[0]) {
      // Delete old image
      deleteFile(voter.voter_image);
      const newFile = req.files.voter_image[0];
      const sanitizedVoterName = voter.name.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
      const entityType = `voters/${sanitizedVoterName}`;
      const newVoterImagePath = await processFile(newFile.buffer, newFile.mimetype, entityType, `voter_${Date.now()}.webp`);
      req.body.voter_image = newVoterImagePath;
    }
    if (req.files?.aadhar_image?.[0]) {
      deleteFile(voter.aadhar_image);
      const newFile = req.files.aadhar_image[0];
      const sanitizedVoterName = voter.name.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
      const entityType = `voters/${sanitizedVoterName}`;
      const newAadharImagePath = await processFile(newFile.buffer, newFile.mimetype, entityType, `aadhar_${Date.now()}.webp`);
      req.body.aadhar_image = newAadharImagePath;
    }

    // Handle support if provided
    if (req.body.support) {
      const validSupports = ['neutral', 'supporter', 'opposition'];
      if (!validSupports.includes(req.body.support)) {
        return res.status(400).json({ success: false, message: "Invalid support status" });
      }
    }

    const updatedVoter = await Voter.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate("ward", "ward_name ward_number")
      .populate("created_by", "name email");

    res.status(200).json({ success: true, message: "Voter updated successfully", voter: updatedVoter });
  } catch (error) {
    console.error("Update Voter Error:", error);
    res.status(500).json({ success: false, message: "Error updating voter", error: error.message });
  }
};

// ✅ Delete voter (keep 403 for mutations)
const deleteVoter = async (req, res) => {
  try {
    // Role-based access: determine accessible wards
    const user = await User.findById(req.user.id).populate("role_id", "name");
    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }
    const roleName = user.role_id.name;
    let accessibleWardIds = [];
    if (roleName !== "admin") {
      const accessibleCandidateId = await getAccessibleCandidateId(req.user.id, user.email, roleName);
      if (!accessibleCandidateId) {
        return res.status(403).json({ success: false, message: "Access denied: Profile not found" });
      }
      const userWards = await Ward.find({ candidate_id: accessibleCandidateId }).select("_id");
      accessibleWardIds = userWards.map((w) => w._id);
    }

    const voter = await Voter.findById(req.params.id).populate("ward");

    if (!voter) return res.status(404).json({ success: false, message: "Voter not found" });

    // Access check
    if (roleName !== "admin" &&
        !accessibleWardIds.some(id => id.equals(voter.ward._id)) &&
        String(voter.created_by._id) !== String(req.user.id)) {
      return res.status(403).json({ success: false, message: "Not authorized to delete this voter" });
    }

    // Delete images using updated deleteFile
    deleteFile(voter.voter_image);
    deleteFile(voter.aadhar_image);

    // Clean up empty voter folder and images dir
    const sanitizedVoterName = voter.name.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
    const imagesDir = path.join(__dirname, "../Uploads/voters", sanitizedVoterName, "images");
    const voterDir = path.join(__dirname, "../Uploads/voters", sanitizedVoterName);

    // Remove images dir if empty
    if (fs.existsSync(imagesDir) && fs.readdirSync(imagesDir).length === 0) {
      fs.rmdirSync(imagesDir);
    }

    // Remove voter dir if empty
    if (fs.existsSync(voterDir) && fs.readdirSync(voterDir).length === 0) {
      fs.rmdirSync(voterDir);
    }

    await voter.deleteOne();

    res.status(200).json({ success: true, message: "Voter deleted successfully" });
  } catch (error) {
    console.error("Delete Voter Error:", error);
    res.status(500).json({ success: false, message: "Error deleting voter", error: error.message });
  }
};

// ✅ Get wards for dropdown (enhanced role-based, return empty for unauthorized reads)
const getWardsForVoter = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate("role_id", "name");
    if (!user) {
      return emptyWardsResponse(res);
    }
    const roleName = user.role_id.name;
    let query = {};
    if (roleName === "admin") {
      // Show all wards
    } else {
      const accessibleCandidateId = await getAccessibleCandidateId(req.user.id, user.email, roleName);
      if (!accessibleCandidateId) {
        return emptyWardsResponse(res);
      }
      query = { candidate_id: accessibleCandidateId };
    }
    const wards = await Ward.find(query).select("ward_name ward_number localities address_details district state");

    res.status(200).json({ success: true, wards });
  } catch (error) {
    console.error("Get Wards Error:", error);
    // On error, return empty
    return emptyWardsResponse(res);
  }
};

module.exports = {
  createVoter,
  getVoters,
  getVoterById,
  updateVoter,
  deleteVoter,
  getWardsForVoter,
};