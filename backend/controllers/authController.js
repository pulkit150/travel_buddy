// controllers/authController.js - Handles signup, login, OTP verification
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { generateOTP, sendOTPEmail } = require('../utils/sendEmail');
const { updateTrustScore } = require('../utils/trustScore');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @route POST /api/auth/signup
// @desc  Register new user and send OTP
const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      otp,
      otpExpires,
    });

    // Always log OTP to backend terminal
    console.log(`\n=============================`);
    console.log(`OTP for ${email}: ${otp}`);
    console.log(`=============================\n`);

    try {
      await sendOTPEmail(email, otp);
      console.log('✅ Email sent to', email);
    } catch (emailError) {
      console.error('❌ Email failed:', emailError.message);
    }

    res.status(201).json({
      message: 'Account created! Please check your email for OTP verification.',
      userId: user._id,
    });
  } catch (error) {
    res.status(500).json({ message: 'Signup failed', error: error.message });
  }
};

// @route POST /api/auth/verify-otp
// @desc  Verify OTP and activate account
const verifyOTP = async (req, res) => {
  try {
    const { userId, otp } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Check if OTP matches and hasn't expired
    if (user.otp !== otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Activate account and clear OTP
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    // Reward trust score for email verification
    await updateTrustScore(user._id, 'EMAIL_VERIFIED');

    // Generate JWT token for automatic login after verification
    const token = generateToken(user._id);

    res.json({
      message: 'Email verified! Welcome to Travel Buddy!',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        trustScore: user.trustScore,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'OTP verification failed', error: error.message });
  }
};

// @route POST /api/auth/resend-otp
// @desc  Resend OTP to email
const resendOTP = async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.isVerified) return res.status(400).json({ message: 'Already verified' });

    const otp = generateOTP();
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    console.log(`OTP for ${user.email}: ${otp}`); // check Render logs

    try {
      await sendOTPEmail(user.email, otp);
      console.log('✅ Email sent to', user.email);
    } catch (emailError) {
      console.error('❌ Email failed:', emailError.message);
    }

    res.json({ message: 'OTP sent! Check your email or Render logs.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to resend OTP', error: error.message });
  }
};

// @route POST /api/auth/login
// @desc  Login with email and password
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid email or password' });

    // Check if account is verified
    if (!user.isVerified) {
      return res.status(403).json({
        message: 'Please verify your email first',
        userId: user._id,
      });
    }

    // Compare password with hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid email or password' });

    const token = generateToken(user._id);

    res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        profileImage: user.profileImage,
        trustScore: user.trustScore,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
};

module.exports = { signup, verifyOTP, resendOTP, login };