// models/Review.js - Review/rating between users after a trip
const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    fromUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    toUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    trip: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trip',
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

// Prevent duplicate reviews (one review per user per trip)
reviewSchema.index({ fromUser: 1, toUser: 1, trip: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
