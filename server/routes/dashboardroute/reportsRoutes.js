// routes/reportsRoutes.js
const express = require("express");
const { getReports } = require("../../controllers/dashbaords/reportsController");
const authMiddleware = require("../../middleware/auth");

const router = express.Router();

// All routes protected
router.get("/", authMiddleware, getReports);

module.exports = router;