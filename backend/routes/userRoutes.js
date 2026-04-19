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

// Wrap multer in a custom middleware so errors don't crash the server
router.put('/me', protect, (req, res, next) => {
  uploadProfile.single('profileImage')(req, res, (err) => {
    if (err) {
      console.error('Multer error:', err.message);
      // If multer fails (e.g. wrong file type), still try to update without the image
      req.file = null;
    }
    next();
  });
}, updateMyProfile);

router.get('/matches', protect, getMatchedTrips);
router.get('/notifications', protect, getNotifications);
router.put('/notifications/read', protect, markNotificationsRead);
router.get('/:id', protect, getUserProfile);

module.exports = router;