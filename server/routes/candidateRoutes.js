const express = require("express");
const router = express.Router();
const multer = require("multer");
const {
  getAllCandidates,
  getCandidateById,
  createCandidate,
  updateCandidate,
  deleteCandidate,
} = require("../controllers/candidateController");

// Configure multer for memory storage (since controller uses req.file.buffer)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Routes
router.get("/", getAllCandidates);
router.get("/:id", getCandidateById);
router.post("/", upload.single("photo"), createCandidate);
router.put("/:id", upload.single("photo"), updateCandidate);
router.delete("/:id", deleteCandidate);

module.exports = router;