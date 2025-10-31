// Updated controllers/voterController.js (use deleteFile without entityType; fix deleteVoter folder cleanup)
const Voter = require("../models/Voter");
const Ward = require("../models/ward");
const path = require("path");
const fs = require("fs");
const { processFile, deleteFile } = require("../utils/upload"); // Updated import

// ✅ Create Voter (unchanged except relying on updated processFile)
const createVoter = async (req, res) => {
  try {
    const {
      name,
      fathers_name,
      dob,
      phone,
      voter_id,
      aadhar_number,
      ward: wardId,
      address: { house_no, locality, street, city, postal_code },
    } = req.body;

    // Handle file uploads
    const voterImageFile = req.files?.voter_image?.[0];
    const aadharImageFile = req.files?.aadhar_image?.[0];

    if (!voterImageFile || !aadharImageFile) {
      return res.status(400).json({ success: false, message: "Voter image and Aadhar image are required" });
    }

    // Validate ward exists and access (admin full; candidate: own wards)
    const ward = await Ward.findById(wardId);
    if (!ward) {
      return res.status(404).json({ success: false, message: "Ward not found" });
    }

    if (req.user.role === "candidate" && 
        String(ward.candidate_id) !== String(req.user._id)) {
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
      entityType, // This will create Uploads/voters/{name}/images/ and adjust URL
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

// ✅ Get all voters (unchanged)
const getVoters = async (req, res) => {
  try {
    let query = { created_by: req.user.id }; // Default to created_by for security
    if (req.user.role === "admin") {
      query = {}; // Admin sees all
    } else if (req.user.role === "candidate") {
      // Candidates see voters in their wards
      const userWards = await Ward.find({ candidate_id: req.user._id }).select("_id");
      const wardIds = userWards.map((w) => w._id);
      query.ward = { $in: wardIds };
    }

    const voters = await Voter.find(query)
      .populate("ward", "ward_name ward_number candidate_id")
      .populate("created_by", "name email");

    res.status(200).json({ success: true, voters });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching voters", error: error.message });
  }
};

// ✅ Get single voter by ID (unchanged)
const getVoterById = async (req, res) => {
  try {
    const voter = await Voter.findById(req.params.id)
      .populate("ward", "ward_name ward_number candidate_id")
      .populate("created_by", "name email");

    if (!voter) return res.status(404).json({ success: false, message: "Voter not found" });

    // Access check
    if (req.user.role === "candidate") {
      const userWards = await Ward.find({ candidate_id: req.user._id }).select("_id");
      const wardIds = userWards.map((w) => w._id);
      if (!wardIds.includes(voter.ward._id) && String(voter.created_by._id) !== String(req.user._id)) {
        return res.status(403).json({ success: false, message: "Access denied" });
      }
    }

    res.status(200).json({ success: true, voter });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching voter", error: error.message });
  }
};

// ✅ Update voter (updated deleteFile calls; rely on updated processFile)
const updateVoter = async (req, res) => {
  try {
    const voter = await Voter.findById(req.params.id).populate("ward");

    if (!voter) return res.status(404).json({ success: false, message: "Voter not found" });

    // Access check (similar to get)
    if (req.user.role === "candidate") {
      const userWards = await Ward.find({ candidate_id: req.user._id }).select("_id");
      const wardIds = userWards.map((w) => w._id);
      if (!wardIds.includes(voter.ward._id) && String(voter.created_by._id) !== String(req.user._id)) {
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

    const updatedVoter = await Voter.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate("ward", "ward_name ward_number")
      .populate("created_by", "name email");

    res.status(200).json({ success: true, message: "Voter updated successfully", voter: updatedVoter });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error updating voter", error: error.message });
  }
};

// ✅ Delete voter (updated deleteFile calls; improved folder cleanup)
const deleteVoter = async (req, res) => {
  try {
    const voter = await Voter.findById(req.params.id);

    if (!voter) return res.status(404).json({ success: false, message: "Voter not found" });

    // Access check (similar to update)
    if (req.user.role === "candidate") {
      const userWards = await Ward.find({ candidate_id: req.user._id }).select("_id");
      const wardIds = userWards.map((w) => w._id);
      if (!wardIds.includes(voter.ward) && String(voter.created_by._id) !== String(req.user._id)) {
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

// ✅ Get wards for dropdown (unchanged)
const getWardsForVoter = async (req, res) => {
  try {
    let query = {};
    if (req.user.role === "candidate") {
      query = { candidate_id: req.user._id };
    }
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