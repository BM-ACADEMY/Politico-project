// routes/taskRoutes.js (New Routes)
const express = require("express");
const { createTask, getTasks, getMyTasks } = require("../controllers/taskController");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

// All routes protected
router.post("/", authMiddleware, createTask);
router.get("/get-all-task", authMiddleware, getTasks);
router.get("/my-tasks", authMiddleware, getMyTasks); 
module.exports = router;