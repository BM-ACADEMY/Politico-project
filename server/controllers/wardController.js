const Ward = require("../models/ward");
const Candidate = require("../models/candidateModel");

const createWard = async (req, res) => {
  try {
    const { 
      ward_name, ward_number, district, state, population, 
      localities, address_details, candidate_id 
    } = req.body;

    const finalCandidateId = req.user.role === "candidate" 
      ? req.user.id 
      : candidate_id;

    if (!finalCandidateId) {
      return res.status(400).json({ success: false, message: "Candidate ID is required" });
    }

    const newWard = await Ward.create({
      ward_name,
      ward_number,
      candidate_id: finalCandidateId,
      created_by: req.user.id,  // ALWAYS SET HERE
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

// ✅ Get all wards (admin) or own wards (candidate)
const getWards = async (req, res) => {
  try {
    let query = {};
    if (req.user.role === "candidate") {
      query = { candidate_id: req.user._id };
    }
    const wards = await Ward.find(query)
      .populate("candidate_id", "name email party")
      .populate("created_by", "name email");

    res.status(200).json({ success: true, wards });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching wards", error: error.message });
  }
};

// ✅ Get single ward by ID (admin any; candidate: own or created)
const getWardById = async (req, res) => {
  try {
    const ward = await Ward.findById(req.params.id)
      .populate("candidate_id", "name email party")
      .populate("created_by", "name email");

    if (!ward) return res.status(404).json({ success: false, message: "Ward not found" });

    // Allow admin full access; candidate only own wards (by candidate_id or created_by)
    if (req.user.role === "candidate" && 
        String(ward.candidate_id._id) !== String(req.user._id) && 
        String(ward.created_by._id) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    res.status(200).json({ success: true, ward });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching ward", error: error.message });
  }
};

// ✅ Update ward (admin any; candidate: own wards by candidate_id or created_by)
const updateWard = async (req, res) => {
  try {
    const ward = await Ward.findById(req.params.id);

    if (!ward) return res.status(404).json({ success: false, message: "Ward not found" });

    // Allow admin full access; candidate only own wards
    if (req.user.role === "candidate" && 
        String(ward.candidate_id._id) !== String(req.user._id) && 
        String(ward.created_by._id) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: "Not authorized to update this ward" });
    }

    const updatedWard = await Ward.findByIdAndUpdate(req.params.id, req.body, { new: true });

    res.status(200).json({ success: true, message: "Ward updated successfully", ward: updatedWard });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error updating ward", error: error.message });
  }
};

// ✅ Delete ward (admin any; candidate: own wards by candidate_id or created_by)
const deleteWard = async (req, res) => {
  try {
    const ward = await Ward.findById(req.params.id);

    if (!ward) return res.status(404).json({ success: false, message: "Ward not found" });

    // Allow admin full access; candidate only own wards
    if (req.user.role === "candidate" && 
        String(ward.candidate_id._id) !== String(req.user._id) && 
        String(ward.created_by._id) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: "Not authorized to delete this ward" });
    }

    await ward.deleteOne();

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