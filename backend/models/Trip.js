// models/Trip.js - Trip database schema
const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema(
  {
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    destination: {
      type: String,
      required: [true, 'Destination is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
    },
    budget: {
      type: Number,
      required: [true, 'Budget is required'],
    },
    maxMembers: {
      type: Number,
      required: [true, 'Max members is required'],
      min: 2,
    },
    image: {
      type: String,
      default: '',
    },

    // Status of the trip
    status: {
      type: String,
      enum: ['open', 'full', 'completed', 'cancelled'],
      default: 'open',
    },

    // Members who have joined (approved)
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],

    // Users who have requested to join (pending approval)
    pendingRequests: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        message: String, // Optional message when requesting to join
        requestedAt: { type: Date, default: Date.now },
      },
    ],

    // Tags for better matching
    tags: [String], // e.g. ['beach', 'adventure', 'cultural']
  },
  { timestamps: true }
);

module.exports = mongoose.model('Trip', tripSchema);
