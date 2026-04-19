// routes/tripRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { uploadTrip } = require('../config/cloudinary');
const {
  createTrip,
  getAllTrips,
  getTripById,
  updateTrip,
  deleteTrip,
  completeTrip,
  cancelMembership,
  getMyTrips,
} = require('../controllers/tripController');

// Multer wrapper — errors don't crash server, just skip file
const withTripImage = (req, res, next) => {
  uploadTrip.single('image')(req, res, (err) => {
    if (err) { console.error('Multer error:', err.message); req.file = null; }
    next();
  });
};

router.get('/my-trips', protect, getMyTrips);
router.post('/', protect, withTripImage, createTrip);
router.get('/', getAllTrips);
router.get('/:id', getTripById);
router.put('/:id', protect, withTripImage, updateTrip);
router.delete('/:id', protect, deleteTrip);
router.post('/:id/complete', protect, completeTrip);
router.post('/:id/cancel', protect, cancelMembership);

module.exports = router;