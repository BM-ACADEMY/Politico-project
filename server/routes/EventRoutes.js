const express = require("express");
const router = express.Router();
const authMiddleware = require('../middleware/auth'); // Adjust path if needed
const {
  createEvent,
  togglePublished,
  getAllEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  getPublishedEvents,
} = require("../controllers/eventController");

// ==================== PUBLIC ROUTE (No Authentication Required) ====================
router.get("/published", getPublishedEvents);
router.post("/", authMiddleware, createEvent);
router.get("/", authMiddleware, getAllEvents);           
router.get("/:id", authMiddleware, getEventById);
router.put("/:id", authMiddleware, updateEvent);
router.delete("/:id", authMiddleware, deleteEvent);

module.exports = router;