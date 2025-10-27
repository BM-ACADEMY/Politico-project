// routes/partyRoutes.js
const express = require("express");
const router = express.Router();
const {
  getAllParties,
  createParty,
  updateParty,
  deleteParty,
} = require("../controllers/partyController");
const authMiddleware = require("../middleware/auth"); // ← Make sure path is correct
const { upload } = require("../utils/upload"); // your multer config

// PROTECTED ROUTES
router.post("/", authMiddleware, upload.single("logo"), createParty);
router.put("/:id", authMiddleware, upload.single("logo"), updateParty);
router.delete("/:id", authMiddleware, deleteParty);

// PUBLIC
router.get("/", getAllParties);

module.exports = router;