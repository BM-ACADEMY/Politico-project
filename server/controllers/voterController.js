// Updated controllers/voterController.js
// Fix: Ensure wardFilter is converted to ObjectId for consistent querying in find() and aggregate()
// This resolves potential type mismatch issues where ward is stored as ObjectId but query uses string
// Also, ensure wardIds in validation are strings for comparison

const Voter = require("../models/Voter");
const Ward = require("../models/ward");
const Candidate = require("../models/candidateModel");
const mongoose = require("mongoose"); // Ensure mongoose is imported for ObjectId
const path = require("path");
const fs = require("fs");
const { processFile, deleteFile } = require("../utils/upload");

// ✅ Create Voter (unchanged)
const createVoter = async (req, res) => {
  try {
    const {
      name,
      fathers_name,
      dob,
      phone,
      voter_id,
      aadhar_number,
      support, // New field
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

    // Access check (admin full; candidate: own wards) - Updated to use userCandidate for consistency
    const userCandidate = await Candidate.findOne({ created_by: req.user.id });
    if (userCandidate && String(ward.candidate_id) !== String(userCandidate._id)) {
      return res.status(403).json({ success: false, message: "Access denied: Can only add voters to your wards" });
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

// ✅ Get all voters (updated: convert wardFilter to ObjectId)
const getVoters = async (req, res) => {
  try {
    let baseQuery = {}; // Base query for access control
    const userCandidate = await Candidate.findOne({ created_by: req.user.id });
    if (userCandidate) {
      // Candidates see voters in their wards
      const userWards = await Ward.find({ candidate_id: userCandidate._id }).select("_id");
      const wardIds = userWards.map((w) => w._id.toString()); // Strings for comparison
      baseQuery.ward = { $in: userWards.map((w) => w._id) }; // ObjectIds for $in
    } else {
      // Admin/other see all
      baseQuery = {};
    }

    const { page = 1, limit = 10, support, ward: wardFilter } = req.query;
    const filter = {};

    // Apply support filter
    if (support && ['neutral', 'supporter', 'opposition'].includes(support)) {
      filter.support = support;
    }

    // Apply ward filter (with access check and ObjectId conversion)
    if (wardFilter) {
      const wardObjId = new mongoose.Types.ObjectId(wardFilter); // Convert to ObjectId
      if (userCandidate) {
        // For candidates: ensure ward is one of theirs
        const userWards = await Ward.find({ candidate_id: userCandidate._id }).select("_id");
        const wardIds = userWards.map((w) => w._id.toString());
        if (!wardIds.includes(wardFilter)) {
          return res.status(403).json({ success: false, message: "Access denied: Cannot filter by this ward" });
        }
        filter.ward = wardObjId;
      } else {
        // For admins: allow any ward
        filter.ward = wardObjId;
      }
    }

    const finalQuery = { ...baseQuery, ...filter };

    const voters = await Voter.find(finalQuery)
      .populate("ward", "ward_name ward_number")
      .populate("created_by", "name email")
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Voter.countDocuments(finalQuery);

    // Calculate counts based on finalQuery (filtered by ward/support) - use ObjectId in match
    const counts = await Voter.aggregate([
      { $match: finalQuery },
      {
        $group: {
          _id: "$support",
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$count" },
          neutral: { $sum: { $cond: [{ $eq: ["$_id", "neutral"] }, "$count", 0] } },
          supporter: { $sum: { $cond: [{ $eq: ["$_id", "supporter"] }, "$count", 0] } },
          opposition: { $sum: { $cond: [{ $eq: ["$_id", "opposition"] }, "$count", 0] } }
        }
      }
    ]);
    const countResult = counts[0] || { total: 0, neutral: 0, supporter: 0, opposition: 0 };

    res.status(200).json({ 
      success: true, 
      voters, 
      counts: countResult,
      pagination: { page: parseInt(page), limit: parseInt(limit), total }
    });
  } catch (error) {
    console.error("Get Voters Error:", error); // Added logging for debugging
    res.status(500).json({ success: false, message: "Error fetching voters", error: error.message });
  }
};

// ✅ Get single voter by ID (unchanged)
const getVoterById = async (req, res) => {
  try {
    const voter = await Voter.findById(req.params.id)
      .populate("ward", "ward_name ward_number")
      .populate("created_by", "name email");

    if (!voter) return res.status(404).json({ success: false, message: "Voter not found" });

    // Access check (use userCandidate for consistency)
    const userCandidate = await Candidate.findOne({ created_by: req.user.id });
    if (userCandidate) {
      const userWards = await Ward.find({ candidate_id: userCandidate._id }).select("_id");
      const wardIds = userWards.map((w) => w._id);
      if (!wardIds.includes(voter.ward._id) && String(voter.created_by._id) !== String(req.user.id)) {
        return res.status(403).json({ success: false, message: "Not authorized to view this voter" });
      }
    }

    res.status(200).json({ success: true, voter });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching voter", error: error.message });
  }
};

// ✅ Update voter (unchanged)
const updateVoter = async (req, res) => {
  try {
    const voter = await Voter.findById(req.params.id)
      .populate("ward", "ward_name ward_number")
      .populate("created_by", "name email");

    if (!voter) return res.status(404).json({ success: false, message: "Voter not found" });

    // Access check (use userCandidate for consistency)
    const userCandidate = await Candidate.findOne({ created_by: req.user.id });
    if (userCandidate) {
      const userWards = await Ward.find({ candidate_id: userCandidate._id }).select("_id");
      const wardIds = userWards.map((w) => w._id);
      if (!wardIds.includes(voter.ward._id) && String(voter.created_by._id) !== String(req.user.id)) {
        return res.status(403).json({ success: false, message: "Not authorized to update this voter" });
      }
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
    res.status(500).json({ success: false, message: "Error updating voter", error: error.message });
  }
};

// ✅ Delete voter (unchanged)
const deleteVoter = async (req, res) => {
  try {
    const voter = await Voter.findById(req.params.id);

    if (!voter) return res.status(404).json({ success: false, message: "Voter not found" });

    // Access check (use userCandidate for consistency)
    const userCandidate = await Candidate.findOne({ created_by: req.user.id });
    if (userCandidate) {
      const userWards = await Ward.find({ candidate_id: userCandidate._id }).select("_id");
      const wardIds = userWards.map((w) => w._id);
      if (!wardIds.includes(voter.ward) && String(voter.created_by._id) !== String(req.user.id)) {
        return res.status(403).json({ success: false, message: "Not authorized to delete this voter" });
      }
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
    res.status(500).json({ success: false, message: "Error deleting voter", error: error.message });
  }
};

// ✅ Get wards for dropdown (unchanged - already filters for candidates)
const getWardsForVoter = async (req, res) => {
  try {
    let query = {};
    const userCandidate = await Candidate.findOne({ created_by: req.user.id });
    if (userCandidate) {
      query = { candidate_id: userCandidate._id };
    }
    // For users without candidate profile (e.g., admin), show all wards
    const wards = await Ward.find(query).select("ward_name ward_number localities address_details district state");

    res.status(200).json({ success: true, wards });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching wards", error: error.message });
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