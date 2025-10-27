// controllers/partyController.js
const Party = require("../models/Party");
const { processFile, deleteFile } = require("../utils/upload");

// Get All Parties
exports.getAllParties = async (req, res) => {
  try {
    const parties = await Party.find().populate("created_by", "name email");
    res.status(200).json(parties);
  } catch (error) {
    console.error("getAllParties error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get Single Party by ID
exports.getPartyById = async (req, res) => {
  try {
    const party = await Party.findById(req.params.id).populate("created_by", "name email");
    if (!party) return res.status(404).json({ message: "Party not found" });
    res.status(200).json(party);
  } catch (error) {
    console.error("getPartyById error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Create Party
exports.createParty = async (req, res) => {
  try {
    const { parties_name } = req.body;

    if (!parties_name?.trim()) {
      return res.status(400).json({ message: "Party name is required" });
    }

    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const existing = await Party.findOne({ parties_name: parties_name.trim() });
    if (existing) {
      return res.status(400).json({ message: "Party name already exists" });
    }

    let logo = "";
    if (req.file) {
      const fileName = `${Date.now()}_${req.file.originalname}`;
      logo = await processFile(req.file.buffer, req.file.mimetype, "party", fileName);
    }

    const party = await Party.create({
      parties_name: parties_name.trim(),
      logo,
      created_by: req.user.id || req.user._id,
    });

    res.status(201).json({ message: "Party created successfully", party });
  } catch (error) {
    console.error("Create party error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update Party
exports.updateParty = async (req, res) => {
  try {
    const { parties_name } = req.body;
    if (!parties_name?.trim())
      return res.status(400).json({ message: "Party name is required" });

    const updateData = { parties_name: parties_name.trim() };

    // ---- Replace logo if new file uploaded ---------------------------------------------------
    if (req.file) {
      const oldParty = await Party.findById(req.params.id);
      if (!oldParty) return res.status(404).json({ message: "Party not found" });

      // Delete old logo from disk
      if (oldParty.logo) {
        deleteFile(oldParty.logo, "party");
      }

      const fileName = `${Date.now()}_${req.file.originalname}`;
      updateData.logo = await processFile(req.file.buffer, req.file.mimetype, "party", fileName);
    }

    const updatedParty = await Party.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedParty)
      return res.status(404).json({ message: "Party not found" });

    res.status(200).json({ message: "Party updated successfully", updatedParty });
  } catch (error) {
    console.error("Update party error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Delete Party
exports.deleteParty = async (req, res) => {
  try {
    const party = await Party.findById(req.params.id);
    if (!party) {
      return res.status(404).json({ message: "Party not found" });
    }

    // Delete logo from disk using correct folder
    if (party.logo) {
      deleteFile(party.logo, "party"); // Fixed: was "partieslogo"
    }

    await Party.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Party and logo deleted successfully" });
  } catch (error) {
    console.error("deleteParty error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};