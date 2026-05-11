// utils/socket.js
const Message = require('../models/Message');
const Trip = require('../models/Trip');

const setupSocket = (io) => {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join_room', ({ tripId, userId }) => {
      socket.join(tripId);
      console.log(`User ${userId} joined room ${tripId}`);
    });

    socket.on('leave_room', ({ tripId }) => {
      socket.leave(tripId);
    });

    socket.on('send_message', async ({ tripId, senderId, senderName, senderImage, text }) => {
      try {
        const trip = await Trip.findById(tripId);
        const isMember =
          trip &&
          (trip.creator.toString() === senderId ||
            trip.members.some((m) => m.toString() === senderId));

        if (!isMember) {
          socket.emit('error', { message: 'You are not a member of this trip' });
          return;
        }

        const message = await Message.create({ trip: tripId, sender: senderId, text });

        io.to(tripId).emit('receive_message', {
          _id: message._id,
          text,
          senderId,
          senderName,
          senderImage,
          createdAt: message.createdAt,
        });
      } catch (error) {
        console.error('send_message error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    socket.on('join_notifications', ({ userId }) => {
      socket.join(`user_${userId}`);
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });
};

// Send real-time notification to a specific user's personal room
const sendNotification = (io, userId, notification) => {
  if (!io) return; // guard if io not available
  io.to(`user_${userId}`).emit('notification_event', notification);
};

// ✅ FIXED: export as object so named imports work
module.exports = { setupSocket, sendNotification };