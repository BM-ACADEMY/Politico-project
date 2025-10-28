const express = require("express");
const router = express.Router();
const {
  getDashboardStats,
  getLineChartData,
  getBarChartData,
} = require("../../controllers/dashbaords/rootDashboardController"); // Fixed typo in path

router.get("/stats", getDashboardStats);
router.get("/chart/line", getLineChartData);
router.get("/chart/bar", getBarChartData);

module.exports = router;