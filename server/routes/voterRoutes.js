// Updated routes/voterRoutes.js (Removed export route)
const express = require("express");
const {
  createVoter,
  getVoters,
  getVoterById,
  updateVoter,
  deleteVoter,
  getWardsForVoter,
} = require("../controllers/voterController");
const authMiddleware = require("../middleware/auth");
const { upload } = require("../utils/upload");

const router = express.Router();

// All routes protected
router.get("/wards", authMiddleware, getWardsForVoter);
router.post("/", authMiddleware, upload.fields([
  { name: "voter_image", maxCount: 1 },
  { name: "aadhar_image", maxCount: 1 },
]), createVoter);
router.get("/", authMiddleware, getVoters);
router.get("/:id", authMiddleware, getVoterById);
router.put("/:id", authMiddleware, upload.fields([
  { name: "voter_image", maxCount: 1 },
  { name: "aadhar_image", maxCount: 1 },
]), updateVoter);
router.delete("/:id", authMiddleware, deleteVoter);

module.exports = router;