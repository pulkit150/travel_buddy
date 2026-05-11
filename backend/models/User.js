// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, minlength: 6 },

    // OTP verification
    otp: String,
    otpExpires: Date,
    isVerified: { type: Boolean, default: false },

    // Profile
    age: Number,
    bio: String,
    profileImage: { type: String, default: '' },
    interests: [String],
    travelPreferences: {
      style: { type: String, enum: ['budget', 'mid-range', 'luxury'], default: 'mid-range' },
      groupSize: { type: String, enum: ['solo', 'small', 'large'], default: 'small' },
    },

    // Trust Score
    trustScore: { type: Number, default: 50, min: 0, max: 100 },

    // Activity
    tripsCompleted: { type: Number, default: 0 },
    tripsCancelled: { type: Number, default: 0 },
    ratingsReceived: [
      {
        rating: Number,
        comment: String,
        fromUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      },
    ],
    averageRating: { type: Number, default: 0 },

    // ✅ FIXED — notifications is array of OBJECTS not strings
    notifications: [
      {
        message: { type: String, required: true },
        type: { type: String, enum: ['request', 'accepted', 'rejected', 'trip_update'] },
        tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip' },
        isRead: { type: Boolean, default: false },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);