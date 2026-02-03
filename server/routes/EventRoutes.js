// Updated EventRoutes.js
const express = require("express");
const router = express.Router();
const authMiddleware = require('../middleware/auth'); // Adjust path
const {
  createEvent,
  getAllEvents,
  getEventById,
  updateEvent,
  deleteEvent,
} = require("../controllers/eventController");

router.post("/", authMiddleware, createEvent);
router.get("/", authMiddleware, getAllEvents); // authMiddlewareed for user events
router.get("/:id", authMiddleware, getEventById);
router.put("/:id", authMiddleware, updateEvent);
router.delete("/:id", authMiddleware, deleteEvent);

module.exports = router;