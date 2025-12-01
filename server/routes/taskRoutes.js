// routes/taskRoutes.js (New Routes)
const express = require("express");
const { createTask, getTasks, createBulkTasks, getMyTasks,updateMyTask, deleteAttachment } = require("../controllers/taskController");
const authMiddleware = require("../middleware/auth");
const upload = require("../middleware/upload");

const router = express.Router();

// All routes protected
router.post("/", authMiddleware, createTask);
router.get("/get-all-task", authMiddleware, getTasks);
router.get("/my-tasks", authMiddleware, getMyTasks); 
router.put("/my-tasks/:taskId", authMiddleware, upload.array("attachments", 10), updateMyTask);
// routes/taskRoutes.js
router.delete("/my-tasks/attachment/:taskId", authMiddleware, deleteAttachment);
router.post("/bulk", authMiddleware, createBulkTasks);
module.exports = router;