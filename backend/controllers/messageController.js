// controllers/messageController.js - Fetch chat history for a trip
const Message = require('../models/Message');
const Trip = require('../models/Trip');

// @route GET /api/messages/:tripId
// @desc  Get all messages for a trip (only for members)
const getTripMessages = async (req, res) => {
  try {
    const { tripId } = req.params;
    const userId = req.user._id.toString();

    // Verify user is a member of the trip
    const trip = await Trip.findById(tripId);
    if (!trip) return res.status(404).json({ message: 'Trip not found' });

    const isMember =
      trip.creator.toString() === userId ||
      trip.members.some((m) => m.toString() === userId);

    if (!isMember) {
      return res.status(403).json({ message: 'Only trip members can view messages' });
    }

    // Fetch messages, populate sender info
    const messages = await Message.find({ trip: tripId })
      .populate('sender', 'name profileImage')
      .sort({ createdAt: 1 }); // Oldest first for chat display

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch messages', error: error.message });
  }
};

module.exports = { getTripMessages };
