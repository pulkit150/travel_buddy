// controllers/requestController.js - Join request management
const Trip = require('../models/Trip');
const User = require('../models/User');
const { sendNotification } = require('../utils/socket');

// @route POST /api/requests/:tripId/request
// @desc  Send a join request for a trip
const sendJoinRequest = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.tripId);
    if (!trip) return res.status(404).json({ message: 'Trip not found' });

    if (trip.status !== 'open') {
      return res.status(400).json({ message: 'This trip is not accepting new members' });
    }

    const userId = req.user._id.toString();

    // Prevent creator from requesting their own trip
    if (trip.creator.toString() === userId) {
      return res.status(400).json({ message: 'You are the creator of this trip' });
    }

    // Prevent duplicate requests
    const alreadyRequested = trip.pendingRequests.some((r) => r.user.toString() === userId);
    if (alreadyRequested) return res.status(400).json({ message: 'You already have a pending request' });

    // Prevent if already a member
    const alreadyMember = trip.members.some((m) => m.toString() === userId);
    if (alreadyMember) return res.status(400).json({ message: 'You are already a member' });

    // Add the request
    trip.pendingRequests.push({
      user: req.user._id,
      message: req.body.message || '',
    });
    await trip.save();

    // Notify trip creator via socket and save to DB
    const notification = {
      message: `${req.user.name} wants to join your trip to ${trip.destination}`,
      type: 'request',
      tripId: trip._id,
    };
    await User.findByIdAndUpdate(trip.creator, {
      $push: { notifications: notification },
    });
    sendNotification(req.io, trip.creator.toString(), notification);

    res.json({ message: 'Join request sent!' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to send request', error: error.message });
  }
};

// @route PUT /api/requests/:tripId/accept/:userId
// @desc  Accept a join request (only trip creator)
const acceptRequest = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.tripId);
    if (!trip) return res.status(404).json({ message: 'Trip not found' });

    // Only creator can accept
    if (trip.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the trip creator can accept requests' });
    }

    const { userId } = req.params;

    // Check if request exists
    const requestIndex = trip.pendingRequests.findIndex((r) => r.user.toString() === userId);
    if (requestIndex === -1) return res.status(404).json({ message: 'Request not found' });

    // Check if trip is full
    if (trip.members.length >= trip.maxMembers) {
      return res.status(400).json({ message: 'Trip is already full' });
    }

    // Move user from pendingRequests to members
    trip.members.push(userId);
    trip.pendingRequests.splice(requestIndex, 1);

    // If trip is now full, update status
    if (trip.members.length >= trip.maxMembers) {
      trip.status = 'full';
    }

    await trip.save();

    // Notify the accepted user
    const notification = {
      message: `Your request to join the trip to ${trip.destination} was accepted!`,
      type: 'accepted',
      tripId: trip._id,
    };
    await User.findByIdAndUpdate(userId, { $push: { notifications: notification } });
    sendNotification(req.io, userId, notification);

    res.json({ message: `User accepted to the trip!` });
  } catch (error) {
    res.status(500).json({ message: 'Failed to accept request', error: error.message });
  }
};

// @route PUT /api/requests/:tripId/reject/:userId
// @desc  Reject a join request (only trip creator)
const rejectRequest = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.tripId);
    if (!trip) return res.status(404).json({ message: 'Trip not found' });

    if (trip.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the trip creator can reject requests' });
    }

    const { userId } = req.params;

    // Remove user from pending requests
    trip.pendingRequests = trip.pendingRequests.filter((r) => r.user.toString() !== userId);
    await trip.save();

    // Notify the rejected user
    const notification = {
      message: `Your request to join the trip to ${trip.destination} was not accepted.`,
      type: 'rejected',
      tripId: trip._id,
    };
    await User.findByIdAndUpdate(userId, { $push: { notifications: notification } });
    sendNotification(req.io, userId, notification);

    res.json({ message: 'Request rejected' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to reject request', error: error.message });
  }
};

module.exports = { sendJoinRequest, acceptRequest, rejectRequest };
