const express = require('express');
const router = express.Router();
const {
  createJoin,
  getAllJoins,
  getJoinById,
  updateJoinStatus,
  deleteJoin,
  getJoinByPhone, // Add this
} = require('../controllers/Joincontroller');

const { upload } = require('../utils/upload');

// Routes
router.post('/', upload.single('image'), createJoin);
router.get('/', getAllJoins);
router.get('/:id', getJoinById);
router.get('/phone/:phone', getJoinByPhone); // Add this new route
router.put('/:id/status', updateJoinStatus);
router.delete('/:id', deleteJoin);

module.exports = router;