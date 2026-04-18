// utils/socket.js - Socket.io event handlers for chat and notifications
const Message = require('../models/Message');
const Trip = require('../models/Trip');

const setupSocket = (io) => {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Join a trip's chat room
    // Client emits: { tripId, userId }
    socket.on('join_room', ({ tripId, userId }) => {
      socket.join(tripId); // Join the room identified by tripId
      console.log(`User ${userId} joined room ${tripId}`);
    });

    // Leave a room
    socket.on('leave_room', ({ tripId }) => {
      socket.leave(tripId);
    });

    // Send a message to a trip's chat room
    // Client emits: { tripId, senderId, senderName, text }
    socket.on('send_message', async ({ tripId, senderId, senderName, senderImage, text }) => {
      try {
        // Verify sender is a member of the trip
        const trip = await Trip.findById(tripId);
        const isMember =
          trip &&
          (trip.creator.toString() === senderId || trip.members.some((m) => m.toString() === senderId));

        if (!isMember) {
          socket.emit('error', { message: 'You are not a member of this trip' });
          return;
        }

        // Save message to database
        const message = await Message.create({
          trip: tripId,
          sender: senderId,
          text,
        });

        // Broadcast the message to all users in the room
        io.to(tripId).emit('receive_message', {
          _id: message._id,
          text,
          senderId,
          senderName,
          senderImage,
          createdAt: message.createdAt,
        });
      } catch (error) {
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle real-time notifications
    // Join a personal notification room (userId)
    socket.on('join_notifications', ({ userId }) => {
      socket.join(`user_${userId}`); // Personal room for notifications
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });
};

// Helper to send notification to a specific user
// Called from controllers
const sendNotification = (io, userId, notification) => {
  io.to(`user_${userId}`).emit('notification_event', notification);
};

module.exports = setupSocket;
module.exports.sendNotification = sendNotification;
