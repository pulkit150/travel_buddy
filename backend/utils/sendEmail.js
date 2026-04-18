// utils/sendEmail.js - Send OTP emails using Nodemailer
const nodemailer = require('nodemailer');

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Generate a 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP email
const sendOTPEmail = async (email, otp) => {
  const mailOptions = {
    from: `"Travel Buddy" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Verify your Travel Buddy account',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0ea5e9;">Welcome to Travel Buddy!</h2>
        <p>Your verification code is:</p>
        <div style="background: #f0f9ff; padding: 20px; text-align: center; border-radius: 8px;">
          <h1 style="color: #0284c7; letter-spacing: 8px; font-size: 36px;">${otp}</h1>
        </div>
        <p>This code expires in <strong>10 minutes</strong>.</p>
        <p>If you didn't request this, please ignore this email.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { generateOTP, sendOTPEmail };
