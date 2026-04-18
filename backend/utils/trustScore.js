// utils/trustScore.js - Trust score update logic
// This is the central place to manage trust score changes

const User = require('../models/User');

// Trust score change rules
const TRUST_CHANGES = {
  TRIP_COMPLETED: +10,
  PROFILE_COMPLETED: +5,
  EMAIL_VERIFIED: +5,
  POSITIVE_RATING: +2,   // rating >= 4
  NEGATIVE_RATING: -2,   // rating <= 2
  CANCELLED_AFTER_JOIN: -15,
  REPORTED: -20,
};

/**
 * Update a user's trust score
 * @param {string} userId - The user's MongoDB ID
 * @param {string} reason - Key from TRUST_CHANGES
 */
const updateTrustScore = async (userId, reason) => {
  const change = TRUST_CHANGES[reason];
  if (change === undefined) return;

  // Use $inc to atomically increment, then clamp between 0-100
  const user = await User.findById(userId);
  if (!user) return;

  user.trustScore = Math.max(0, Math.min(100, user.trustScore + change));
  await user.save();

  return user.trustScore;
};

module.exports = { updateTrustScore, TRUST_CHANGES };
