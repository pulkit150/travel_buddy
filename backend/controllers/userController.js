// controllers/userController.js - User profile, matching, notifications
const User = require('../models/User');
const Trip = require('../models/Trip');
const { updateTrustScore } = require('../utils/trustScore');

// @route GET /api/users/me
const getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password -otp -otpExpires');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch profile', error: error.message });
  }
};

// @route PUT /api/users/me
const updateMyProfile = async (req, res) => {
  try {
    const { name, age, bio, interests, travelPreferences } = req.body;

    console.log('Profile update received:', { name, age, bio, interests, travelPreferences });
    console.log('File:', req.file ? (req.file.filename || req.file.path) : 'none');

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (name) user.name = name;
    if (age)  user.age  = Number(age);
    if (bio !== undefined) user.bio = bio;

    // FormData sends arrays as JSON strings — parse them back
    if (interests !== undefined && interests !== '') {
      try {
        user.interests = typeof interests === 'string' ? JSON.parse(interests) : interests;
      } catch (e) {
        user.interests = [];
      }
    }

    if (travelPreferences !== undefined && travelPreferences !== '') {
      try {
        user.travelPreferences = typeof travelPreferences === 'string'
          ? JSON.parse(travelPreferences)
          : travelPreferences;
      } catch (e) {
        console.warn('Could not parse travelPreferences');
      }
    }

    // Cloudinary → full https:// URL in req.file.path
    // Local disk → filename in req.file.filename
    if (req.file) {
      user.profileImage = req.file.path && req.file.path.startsWith('http')
        ? req.file.path
        : `/uploads/${req.file.filename}`;
    }

    await user.save();

    const isProfileComplete = user.name && user.age && user.bio && user.interests && user.interests.length > 0;
    if (isProfileComplete) {
      await updateTrustScore(user._id, 'PROFILE_COMPLETED');
    }

    const updatedUser = await User.findById(user._id).select('-password -otp -otpExpires');
    res.json({ message: 'Profile updated successfully', user: updatedUser });

  } catch (error) {
    console.error('updateMyProfile ERROR:', error);
    res.status(500).json({ message: 'Failed to update profile', error: error.message });
  }
};

// @route GET /api/users/:id
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select(
      'name bio age interests profileImage trustScore averageRating tripsCompleted tripsCancelled ratingsReceived'
    );
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch user', error: error.message });
  }
};

// @route GET /api/users/matches
const getMatchedTrips = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const { budget } = req.query;
    const trips = await Trip.find({ status: 'open' })
      .populate('creator', 'name profileImage trustScore')
      .lean();

    const scored = trips.map((trip) => {
      let score = 0;
      if (trip.tags && user.interests) {
        trip.tags.forEach((tag) => { if (user.interests.includes(tag)) score++; });
      }
      if (budget && trip.budget <= Number(budget)) score += 2;
      return { ...trip, matchScore: score };
    });

    scored.sort((a, b) => b.matchScore - a.matchScore);
    res.json(scored.slice(0, 10));
  } catch (error) {
    res.status(500).json({ message: 'Failed to get matches', error: error.message });
  }
};

// @route GET /api/users/notifications
const getNotifications = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('notifications');
    res.json([...user.notifications].reverse());
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
};

// @route PUT /api/users/notifications/read
const markNotificationsRead = async (req, res) => {
  try {
    await User.updateOne({ _id: req.user._id }, { $set: { 'notifications.$[].isRead': true } });
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update notifications' });
  }
};

module.exports = { getMyProfile, updateMyProfile, getUserProfile, getMatchedTrips, getNotifications, markNotificationsRead };