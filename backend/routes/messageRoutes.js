// routes/messageRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getTripMessages } = require('../controllers/messageController');

router.get('/:tripId', protect, getTripMessages);

module.exports = router;
