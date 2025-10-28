const Candidate = require("../models/candidateModel");
const User = require("../models/usermodel");
const Role = require("../models/role");
const mongoose = require("mongoose");
const { processFile, deleteFile } = require("../utils/upload");

// Get All Candidates
exports.getAllCandidates = async (req, res) => {
  try {
    const candidates = await Candidate.find().populate("party", "name logo parties_name");
    res.status(200).json(candidates);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get Single Candidate
exports.getCandidateById = async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id).populate("party", "name logo parties_name");
    if (!candidate) return res.status(404).json({ message: "Candidate not found" });
    res.status(200).json(candidate);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Create Candidate
// controllers/candidateController.js

exports.createCandidate = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { name, phone, email, password, party, gender, dob, created_by } = req.body;

    if (!name || !email || !phone || !password || !party || !gender || !dob) {
      throw new Error("All fields are required");
    }

    // 1. Find or create 'candidate' role
    let role = await Role.findOne({ name: "candidate" }).session(session);
    if (!role) {
      const roles = await Role.create([{ name: "candidate", description: "Candidate role" }], { session });
      role = roles[0];
    }

    // 2. Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { phone }] }).session(session);
    if (existingUser) {
      throw new Error("Email or phone already exists");
    }

    // 3. Process photo upload
    let photo = "";
    if (req.file) {
      const fileName = `${Date.now()}_${req.file.originalname}`;
      photo = await processFile(req.file.buffer, req.file.mimetype, "candidateimages", fileName);
    }

    // 4. Create User
    const userResult = await User.create([{
      name,
      email,
      phone,
      password,
      role_id: role._id,
      created_by: created_by || null
    }], { session });

    if (!userResult || userResult.length === 0) {
      throw new Error("Failed to create user account");
    }

    const user = userResult[0];

    // 5. Create Candidate
    const candidateResult = await Candidate.create([{
      name,
      phone,
      email,
      password,
      photo,
      party,
      gender,
      dob,
      created_by: user._id  // ← Now safe: user exists
    }], { session });

    if (!candidateResult || candidateResult.length === 0) {
      throw new Error("Failed to create candidate");
    }

    const candidate = candidateResult[0];

    await session.commitTransaction();
    res.status(201).json({ message: "Candidate created successfully", candidate });
  } catch (error) {
    await session.abortTransaction();
    console.error("Create candidate error:", error);
    res.status(400).json({ message: error.message || "Server error" });
  } finally {
    session.endSession();
  }
};

// Update Candidate
exports.updateCandidate = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { name, phone, email, party, gender, dob, password } = req.body;
    const candidateId = req.params.id;

    const candidate = await Candidate.findById(candidateId).session(session);
    if (!candidate) throw new Error("Candidate not found");

    let photo = candidate.photo;
    if (req.file) {
      if (photo) deleteFile(photo, "candidateimages");
      const fileName = `${Date.now()}_${req.file.originalname}`;
      photo = await processFile(req.file.buffer, req.file.mimetype, "candidateimages", fileName);
    }

    const updatedCandidate = await Candidate.findByIdAndUpdate(
      candidateId,
      { name, phone, email, photo, party, gender, dob },
      { new: true, session }
    );

    const userUpdate = { name, email, phone };
    if (password) userUpdate.password = password;

    await User.findOneAndUpdate(
      { email: candidate.email },
      userUpdate,
      { session }
    );

    await session.commitTransaction();
    res.status(200).json({ message: "Candidate updated", candidate: updatedCandidate });
  } catch (error) {
    await session.abortTransaction();
    res.status(400).json({ message: error.message || "Server error" });
  } finally {
    session.endSession();
  }
};

// Delete Candidate
exports.deleteCandidate = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const candidate = await Candidate.findById(req.params.id).session(session);
    if (!candidate) throw new Error("Candidate not found");

    if (candidate.photo) {
      deleteFile(candidate.photo, "candidateimages");
    }

    await Candidate.findByIdAndDelete(req.params.id).session(session);
    await User.findOneAndDelete({ email: candidate.email }).session(session);

    await session.commitTransaction();
    res.status(200).json({ message: "Candidate and user deleted" });
  } catch (error) {
    await session.abortTransaction();
    res.status(400).json({ message: error.message || "Server error" });
  } finally {
    session.endSession();
  }
};