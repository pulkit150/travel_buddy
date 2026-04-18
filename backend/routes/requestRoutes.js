// routes/requestRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { sendJoinRequest, acceptRequest, rejectRequest } = require('../controllers/requestController');

router.post('/:tripId/request', protect, sendJoinRequest);
router.put('/:tripId/accept/:userId', protect, acceptRequest);
router.put('/:tripId/reject/:userId', protect, rejectRequest);

module.exports = router;
