// controllers/partyController.js
const Party = require("../models/Party");
const User = require("../models/User");

// ✅ Get All Parties
exports.getAllParties = async (req, res) => {
  try {
    const parties = await Party.find().populate("created_by", "name email");
    res.status(200).json(parties);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ Get Single Party by ID
exports.getPartyById = async (req, res) => {
  try {
    const party = await Party.findById(req.params.id).populate("created_by", "name email");
    if (!party) return res.status(404).json({ message: "Party not found" });
    res.status(200).json(party);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ Create Party
exports.createParty = async (req, res) => {
  try {
    const { parties_name, logo } = req.body;

    // Check if party already exists
    const existingParty = await Party.findOne({ parties_name });
    if (existingParty) {
      return res.status(400).json({ message: "Party name already exists" });
    }

    // Assume req.user is the logged-in user (middleware must set it)
    const created_by = req.user._id;

    const party = await Party.create({ parties_name, logo, created_by });
    res.status(201).json({ message: "Party created successfully", party });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ Update Party
exports.updateParty = async (req, res) => {
  try {
    const { parties_name, logo } = req.body;

    const updatedParty = await Party.findByIdAndUpdate(
      req.params.id,
      { parties_name, logo },
      { new: true, runValidators: true }
    );

    if (!updatedParty) return res.status(404).json({ message: "Party not found" });
    res.status(200).json({ message: "Party updated successfully", updatedParty });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ Delete Party
exports.deleteParty = async (req, res) => {
  try {
    const deletedParty = await Party.findByIdAndDelete(req.params.id);
    if (!deletedParty) return res.status(404).json({ message: "Party not found" });
    res.status(200).json({ message: "Party deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
