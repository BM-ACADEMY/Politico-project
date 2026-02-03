// routes/taskRoutes.js (New Routes)
const express = require("express");
const { createTask, getTasks } = require("../controllers/taskController");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

// All routes protected
router.post("/", authMiddleware, createTask);
router.get("/", authMiddleware, getTasks);

module.exports = router;