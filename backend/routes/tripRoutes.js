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

router.get('/my-trips', protect, getMyTrips);
router.post('/', protect, uploadTrip.single('image'), createTrip);
router.get('/', getAllTrips);
router.get('/:id', getTripById);
router.put('/:id', protect, uploadTrip.single('image'), updateTrip);
router.delete('/:id', protect, deleteTrip);
router.post('/:id/complete', protect, completeTrip);
router.post('/:id/cancel', protect, cancelMembership);

module.exports = router;
