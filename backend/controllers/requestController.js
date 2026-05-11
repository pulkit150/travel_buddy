// controllers/requestController.js
const Trip = require('../models/Trip');
const User = require('../models/User');
const { sendNotification } = require('../utils/socket');

// helper — safely emit without crashing if socket unavailable
const safeEmit = (io, room, event, data) => {
  try { if (io) io.to(room).emit(event, data); } catch (e) {}
};

// @route POST /api/requests/:tripId/request
const sendJoinRequest = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.tripId);
    if (!trip) return res.status(404).json({ message: 'Trip not found' });

    if (trip.status !== 'open')
      return res.status(400).json({ message: 'This trip is not accepting new members' });

    const userId = req.user._id.toString();

    if (trip.creator.toString() === userId)
      return res.status(400).json({ message: 'You are the creator of this trip' });

    const wasRejected = trip.rejectedUsers?.some(id => id.toString() === userId);
    if (wasRejected)
      return res.status(403).json({ message: 'Your request was previously rejected by the host' });

    const alreadyRequested = trip.pendingRequests.some(r => r.user.toString() === userId);
    if (alreadyRequested)
      return res.status(400).json({ message: 'You already have a pending request' });

    const alreadyMember = trip.members.some(m => m.toString() === userId);
    if (alreadyMember)
      return res.status(400).json({ message: 'You are already a member of this trip' });

    trip.pendingRequests.push({ user: req.user._id, message: req.body.message || '' });
    await trip.save();

    const notification = {
      message: `${req.user.name} wants to join your trip to ${trip.destination}`,
      type: 'request',
      tripId: trip._id,
    };

    await User.findByIdAndUpdate(trip.creator, { $push: { notifications: notification } });

    // notify host in real-time
    safeEmit(req.io, `user_${trip.creator}`, 'notification_event', notification);
    // tell everyone viewing this trip to refresh
    safeEmit(req.io, trip._id.toString(), 'trip_updated', trip._id.toString());

    res.json({ message: 'Join request sent! Waiting for host approval.' });
  } catch (error) {
    console.error('sendJoinRequest error:', error);
    res.status(500).json({ message: 'Failed to send request', error: error.message });
  }
};

// @route PUT /api/requests/:tripId/accept/:userId
const acceptRequest = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.tripId);
    if (!trip) return res.status(404).json({ message: 'Trip not found' });

    if (trip.creator.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Only the trip creator can accept requests' });

    const { userId } = req.params;

    const requestIndex = trip.pendingRequests.findIndex(r => r.user.toString() === userId);
    if (requestIndex === -1)
      return res.status(404).json({ message: 'Request not found' });

    if (trip.members.length >= trip.maxMembers)
      return res.status(400).json({ message: 'Trip is already full' });

    // move from pending → members
    trip.members.push(userId);
    trip.pendingRequests.splice(requestIndex, 1);
    if (trip.members.length >= trip.maxMembers) trip.status = 'full';

    await trip.save();

    const notification = {
      message: `✅ Your request to join the trip to ${trip.destination} was accepted!`,
      type: 'accepted',
      tripId: trip._id,
    };

    await User.findByIdAndUpdate(userId, { $push: { notifications: notification } });

    // notify accepted user + refresh all trip viewers — all wrapped safely
    safeEmit(req.io, `user_${userId}`, 'notification_event', notification);
    safeEmit(req.io, trip._id.toString(), 'trip_updated', trip._id.toString());

    res.json({ message: 'User accepted to the trip!' });
  } catch (error) {
    console.error('acceptRequest error:', error);
    res.status(500).json({ message: 'Failed to accept request', error: error.message });
  }
};

// @route PUT /api/requests/:tripId/reject/:userId
const rejectRequest = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.tripId);
    if (!trip) return res.status(404).json({ message: 'Trip not found' });

    if (trip.creator.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Only the trip creator can reject requests' });

    const { userId } = req.params;

    // remove from pending
    trip.pendingRequests = trip.pendingRequests.filter(r => r.user.toString() !== userId);

    // add to rejected so they can't re-request
    if (!trip.rejectedUsers) trip.rejectedUsers = [];
    if (!trip.rejectedUsers.some(id => id.toString() === userId)) {
      trip.rejectedUsers.push(userId);
    }

    await trip.save();

    const notification = {
      message: `❌ Your request to join the trip to ${trip.destination} was not accepted.`,
      type: 'rejected',
      tripId: trip._id,
    };

    await User.findByIdAndUpdate(userId, { $push: { notifications: notification } });

    safeEmit(req.io, `user_${userId}`, 'notification_event', notification);
    safeEmit(req.io, trip._id.toString(), 'trip_updated', trip._id.toString());

    res.json({ message: 'Request rejected' });
  } catch (error) {
    console.error('rejectRequest error:', error);
    res.status(500).json({ message: 'Failed to reject request', error: error.message });
  }
};

module.exports = { sendJoinRequest, acceptRequest, rejectRequest };