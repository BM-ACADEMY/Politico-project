// controllers/wardController.js (fixed: use req.user.id instead of req.user._id)
const Ward = require("../models/ward");
const Candidate = require("../models/candidateModel");

const createWard = async (req, res) => {
  try {
    // Ensure user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: "Unauthorized: User not authenticated" });
    }

    const { 
      ward_name, ward_number, district, state, population, 
      localities, address_details, candidate_id 
    } = req.body;

    const userCandidate = await Candidate.findOne({ created_by: req.user.id });
    let finalCandidateId;

    if (userCandidate) {
      finalCandidateId = userCandidate._id;
    } else {
      finalCandidateId = candidate_id;
      if (!finalCandidateId) {
        return res.status(400).json({ success: false, message: "Candidate ID is required" });
      }
    }

    const newWard = await Ward.create({
      ward_name,
      ward_number,
      candidate_id: finalCandidateId,
      created_by: req.user.id,
      district,
      state,
      population,
      localities,
      address_details,
    });

    res.status(201).json({ success: true, message: "Ward created successfully", ward: newWard });
  } catch (error) {
    console.error("Create Ward Error:", error);
    res.status(500).json({ success: false, message: "Error creating ward", error: error.message });
  }
};

// Get all wards (admin sees all; candidate sees own)
const getWards = async (req, res) => {
  try {
    // Ensure user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: "Unauthorized: User not authenticated" });
    }

    const userCandidate = await Candidate.findOne({ created_by: req.user.id });
    let query = {};
    if (userCandidate) {
      query = { candidate_id: userCandidate._id };
    }
    const wards = await Ward.find(query)
      .populate("candidate_id", "name email party photo")
      .populate("created_by", "name email");

    res.status(200).json({ success: true, wards });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching wards", error: error.message });
  }
};

// Get single ward by ID (admin any; candidate: own)
const getWardById = async (req, res) => {
  try {
    // Ensure user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: "Unauthorized: User not authenticated" });
    }

    const ward = await Ward.findById(req.params.id)
      .populate("candidate_id", "name email party photo")
      .populate("created_by", "name email");

    if (!ward) return res.status(404).json({ success: false, message: "Ward not found" });

    const userCandidate = await Candidate.findOne({ created_by: req.user.id });
    if (userCandidate && ward.candidate_id._id.toString() !== userCandidate._id.toString()) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    res.status(200).json({ success: true, ward });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching ward", error: error.message });
  }
};

// Update ward (admin any; candidate: own only, no candidate_id change)
const updateWard = async (req, res) => {
  try {
    // Ensure user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: "Unauthorized: User not authenticated" });
    }

    const ward = await Ward.findById(req.params.id);

    if (!ward) return res.status(404).json({ success: false, message: "Ward not found" });

    const userCandidate = await Candidate.findOne({ created_by: req.user.id });
    if (userCandidate && ward.candidate_id._id.toString() !== userCandidate._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized to update this ward" });
    }
    // Prevent candidates from changing candidate_id
    if (userCandidate) {
      delete req.body.candidate_id;
    }

    const updatedWard = await Ward.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate("candidate_id", "name email party photo");

    res.status(200).json({ success: true, message: "Ward updated successfully", ward: updatedWard });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error updating ward", error: error.message });
  }
};

// Delete ward (admin any; candidate: own only)
const deleteWard = async (req, res) => {
  try {
    // Ensure user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: "Unauthorized: User not authenticated" });
    }

    const ward = await Ward.findById(req.params.id);

    if (!ward) return res.status(404).json({ success: false, message: "Ward not found" });

    const userCandidate = await Candidate.findOne({ created_by: req.user.id });
    if (userCandidate && ward.candidate_id._id.toString() !== userCandidate._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized to delete this ward" });
    }

    await Ward.findByIdAndDelete(req.params.id);

    res.status(200).json({ success: true, message: "Ward deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error deleting ward", error: error.message });
  }
};

module.exports = {
  createWard,
  getWards,
  getWardById,
  updateWard,
  deleteWard,
};