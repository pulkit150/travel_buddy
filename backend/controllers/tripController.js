// controllers/tripController.js - Trip CRUD operations
const Trip = require('../models/Trip');
const User = require('../models/User');

// @route POST /api/trips
// @desc  Create a new trip
const createTrip = async (req, res) => {
  try {
    const { destination, description, startDate, endDate, budget, maxMembers, tags } = req.body;

    const trip = await Trip.create({
      creator: req.user._id,
      destination,
      description,
      startDate,
      endDate,
      budget: Number(budget),
      maxMembers: Number(maxMembers),
      tags: tags ? JSON.parse(tags) : [],
      members: [req.user._id], // Creator is auto-added as first member
      // Handle image URL — Cloudinary returns a full URL, local returns a filename
      image: req.file
        ? req.file.path?.startsWith('http')
          ? req.file.path
          : `/uploads/${req.file.filename}`
        : '',
    });

    await trip.populate('creator', 'name profileImage trustScore');

    res.status(201).json({ message: 'Trip created!', trip });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create trip', error: error.message });
  }
};

// @route GET /api/trips
// @desc  Get all open trips with optional filters
const getAllTrips = async (req, res) => {
  try {
    const { destination, minBudget, maxBudget, startDate } = req.query;

    // Build filter object
    const filter = { status: 'open' };
    if (destination) filter.destination = { $regex: destination, $options: 'i' };
    if (minBudget || maxBudget) {
      filter.budget = {};
      if (minBudget) filter.budget.$gte = Number(minBudget);
      if (maxBudget) filter.budget.$lte = Number(maxBudget);
    }
    if (startDate) filter.startDate = { $gte: new Date(startDate) };

    const trips = await Trip.find(filter)
      .populate('creator', 'name profileImage trustScore')
      .sort({ createdAt: -1 }); // Newest first

    res.json(trips);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch trips', error: error.message });
  }
};

// @route GET /api/trips/:id
// @desc  Get single trip details
const getTripById = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id)
      .populate('creator', 'name profileImage trustScore bio')
      .populate('members', 'name profileImage trustScore')
      .populate('pendingRequests.user', 'name profileImage trustScore');

    if (!trip) return res.status(404).json({ message: 'Trip not found' });

    res.json(trip);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch trip', error: error.message });
  }
};

// @route PUT /api/trips/:id
// @desc  Update trip (only by creator)
const updateTrip = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ message: 'Trip not found' });

    // Only creator can update
    if (trip.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the trip creator can edit this trip' });
    }

    const { destination, description, startDate, endDate, budget, maxMembers, status } = req.body;
    if (destination) trip.destination = destination;
    if (description) trip.description = description;
    if (startDate) trip.startDate = startDate;
    if (endDate) trip.endDate = endDate;
    if (budget) trip.budget = Number(budget);
    if (maxMembers) trip.maxMembers = Number(maxMembers);
    if (status) trip.status = status;
    if (req.file) trip.image = req.file.path;

    await trip.save();
    res.json({ message: 'Trip updated!', trip });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update trip', error: error.message });
  }
};

// @route DELETE /api/trips/:id
// @desc  Delete trip (only by creator)
const deleteTrip = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ message: 'Trip not found' });

    if (trip.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the trip creator can delete this trip' });
    }

    await trip.deleteOne();
    res.json({ message: 'Trip deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete trip', error: error.message });
  }
};

// @route POST /api/trips/:id/complete
// @desc  Mark trip as completed (only by creator)
const completeTrip = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ message: 'Trip not found' });

    if (trip.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the creator can complete this trip' });
    }

    trip.status = 'completed';
    await trip.save();

    // Update all members' trip count and trust score
    const { updateTrustScore } = require('../utils/trustScore');
    for (const memberId of trip.members) {
      await User.findByIdAndUpdate(memberId, { $inc: { tripsCompleted: 1 } });
      await updateTrustScore(memberId, 'TRIP_COMPLETED');
    }

    res.json({ message: 'Trip marked as completed!' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to complete trip', error: error.message });
  }
};

// @route POST /api/trips/:id/cancel-membership
// @desc  User cancels their own trip membership
const cancelMembership = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ message: 'Trip not found' });

    const userId = req.user._id.toString();

    // Check if user is a member (but not the creator)
    if (trip.creator.toString() === userId) {
      return res.status(400).json({ message: 'Creator cannot cancel membership. Delete the trip instead.' });
    }

    const isMember = trip.members.some((m) => m.toString() === userId);
    if (!isMember) return res.status(400).json({ message: 'You are not a member of this trip' });

    // Remove user from members
    trip.members = trip.members.filter((m) => m.toString() !== userId);
    if (trip.status === 'full') trip.status = 'open'; // Reopen if was full
    await trip.save();

    // Penalize trust score for cancellation
    const { updateTrustScore } = require('../utils/trustScore');
    await updateTrustScore(userId, 'CANCELLED_AFTER_JOIN');
    await User.findByIdAndUpdate(userId, { $inc: { tripsCancelled: 1 } });

    res.json({ message: 'You have left the trip. Your trust score has been reduced.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to cancel membership', error: error.message });
  }
};

// @route GET /api/trips/my-trips
// @desc  Get trips created by or joined by the current user
const getMyTrips = async (req, res) => {
  try {
    const userId = req.user._id;
    const trips = await Trip.find({
      $or: [{ creator: userId }, { members: userId }],
    }).populate('creator', 'name profileImage');

    res.json(trips);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch your trips', error: error.message });
  }
};

module.exports = { createTrip, getAllTrips, getTripById, updateTrip, deleteTrip, completeTrip, cancelMembership, getMyTrips };
