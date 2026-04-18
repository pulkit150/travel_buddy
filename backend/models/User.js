// models/User.js - User database schema
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
    },
    // OTP for email verification
    otp: String,
    otpExpires: Date,
    isVerified: {
      type: Boolean,
      default: false,
    },

    // Profile fields
    age: Number,
    bio: String,
    profileImage: {
      type: String,
      default: '',
    },
    interests: [String], // e.g. ['hiking', 'photography', 'food']
    travelPreferences: {
      style: { type: String, enum: ['budget', 'mid-range', 'luxury'], default: 'mid-range' },
      groupSize: { type: String, enum: ['solo', 'small', 'large'], default: 'small' },
    },

    // Trust Score System
    // Starts at 50, changes based on behavior
    trustScore: {
      type: Number,
      default: 50,
      min: 0,
      max: 100,
    },

    // Activity tracking
    tripsCompleted: { type: Number, default: 0 },
    tripsCancelled: { type: Number, default: 0 },
    ratingsReceived: [
      {
        rating: Number, // 1-5
        comment: String,
        fromUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      },
    ],
    averageRating: { type: Number, default: 0 },

    // Notifications
    notifications: [
      {
        message: String,
        type: String, // 'request', 'accepted', 'rejected', 'trip_update'
        tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip' },
        isRead: { type: Boolean, default: false },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
