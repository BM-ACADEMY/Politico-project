const express = require("express");
const {
  createWard,
  getWards,
  getWardById,
  updateWard,
  deleteWard,
} = require("../controllers/wardController");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

// All routes protected
router.post("/", authMiddleware, createWard);
router.get("/", authMiddleware, getWards);
router.get("/:id", authMiddleware, getWardById);
router.put("/:id", authMiddleware, updateWard);
router.delete("/:id", authMiddleware, deleteWard);

module.exports = router;
