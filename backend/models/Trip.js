// models/Trip.js
const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema(
  {
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    destination: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    budget: { type: Number, required: true },
    maxMembers: { type: Number, required: true, min: 2 },
    image: { type: String, default: '' },
    status: {
      type: String,
      enum: ['open', 'full', 'completed', 'cancelled'],
      default: 'open',
    },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    pendingRequests: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        message: String,
        requestedAt: { type: Date, default: Date.now },
      },
    ],
    // ✅ NEW — track rejected users so they can't re-request
    rejectedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    tags: [String],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Trip', tripSchema);