// routes/partyRoutes.js
const express = require("express");
const router = express.Router();
const {
  getAllParties,
  getPartyById,
  createParty,
  updateParty,
  deleteParty,
} = require("../controllers/partyController");

const authMiddleware = require('../middleware/auth');


router.get("/", getAllParties);
router.get("/:id", getPartyById);
router.post("/", authMiddleware, createParty); // only logged-in users can create
router.put("/:id", authMiddleware, updateParty);
router.delete("/:id", authMiddleware, deleteParty);

module.exports = router;
