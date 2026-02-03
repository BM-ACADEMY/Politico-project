// routes/volunteerRoutes.js
const express = require("express");
const {
  createVolunteer,
  getVolunteers,
  getVolunteerById,
  updateVolunteer,
  deleteVolunteer,
} = require("../controllers/volunteerController");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

// All routes protected
router.post("/", authMiddleware, createVolunteer);
router.get("/", authMiddleware, getVolunteers);
router.get("/:id", authMiddleware, getVolunteerById);
router.put("/:id", authMiddleware, updateVolunteer);
router.delete("/:id", authMiddleware, deleteVolunteer);

module.exports = router;