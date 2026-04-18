// controllers/reviewController.js - Post-trip ratings and reviews
const Review = require('../models/Review');
const User = require('../models/User');
const Trip = require('../models/Trip');
const { updateTrustScore } = require('../utils/trustScore');

// @route POST /api/reviews
// @desc  Submit a review for another user after a trip
const createReview = async (req, res) => {
  try {
    const { toUserId, tripId, rating, comment } = req.body;
    const fromUserId = req.user._id;

    // Can't review yourself
    if (fromUserId.toString() === toUserId) {
      return res.status(400).json({ message: "You can't review yourself" });
    }

    // Verify both users are members of the trip
    const trip = await Trip.findById(tripId);
    if (!trip) return res.status(404).json({ message: 'Trip not found' });

    const fromIsMember =
      trip.creator.toString() === fromUserId.toString() ||
      trip.members.some((m) => m.toString() === fromUserId.toString());

    const toIsMember =
      trip.creator.toString() === toUserId ||
      trip.members.some((m) => m.toString() === toUserId);

    if (!fromIsMember || !toIsMember) {
      return res.status(403).json({ message: 'Both users must be trip members' });
    }

    // Create review (unique index prevents duplicates)
    const review = await Review.create({
      fromUser: fromUserId,
      toUser: toUserId,
      trip: tripId,
      rating,
      comment,
    });

    // Update the reviewed user's ratings array and average
    const reviewedUser = await User.findById(toUserId);
    reviewedUser.ratingsReceived.push({
      rating,
      comment,
      fromUser: fromUserId,
    });

    // Recalculate average rating
    const total = reviewedUser.ratingsReceived.reduce((sum, r) => sum + r.rating, 0);
    reviewedUser.averageRating = (total / reviewedUser.ratingsReceived.length).toFixed(1);
    await reviewedUser.save();

    // Update trust score based on rating value
    if (rating >= 4) {
      await updateTrustScore(toUserId, 'POSITIVE_RATING');
    } else if (rating <= 2) {
      await updateTrustScore(toUserId, 'NEGATIVE_RATING');
    }

    res.status(201).json({ message: 'Review submitted!', review });
  } catch (error) {
    // Handle duplicate review error
    if (error.code === 11000) {
      return res.status(400).json({ message: 'You have already reviewed this user for this trip' });
    }
    res.status(500).json({ message: 'Failed to submit review', error: error.message });
  }
};

// @route GET /api/reviews/user/:userId
// @desc  Get all reviews for a specific user
const getUserReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ toUser: req.params.userId })
      .populate('fromUser', 'name profileImage')
      .populate('trip', 'destination')
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch reviews', error: error.message });
  }
};

module.exports = { createReview, getUserReviews };
