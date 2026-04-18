// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { uploadProfile } = require('../config/cloudinary');
const {
  getMyProfile,
  updateMyProfile,
  getUserProfile,
  getMatchedTrips,
  getNotifications,
  markNotificationsRead,
} = require('../controllers/userController');

router.get('/me', protect, getMyProfile);
router.put('/me', protect, uploadProfile.single('profileImage'), updateMyProfile);
router.get('/matches', protect, getMatchedTrips);
router.get('/notifications', protect, getNotifications);
router.put('/notifications/read', protect, markNotificationsRead);
router.get('/:id', protect, getUserProfile);

module.exports = router;
