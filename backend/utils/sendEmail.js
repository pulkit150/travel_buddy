// utils/sendEmail.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: false, // false for port 587
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false, // fixes common Gmail TLS issues
  },
});

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendOTPEmail = async (email, otp) => {
  const mailOptions = {
    from: `"TravelBuddy" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Verify your TravelBuddy account',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0ea5e9;">Welcome to TravelBuddy! ✈️</h2>
        <p>Your verification code is:</p>
        <div style="background: #f0f9ff; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
          <h1 style="color: #0284c7; letter-spacing: 8px; font-size: 36px; margin: 0;">${otp}</h1>
        </div>
        <p>This code expires in <strong>10 minutes</strong>.</p>
        <p style="color: #94a3b8; font-size: 12px;">If you didn't request this, please ignore this email.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
  console.log(`OTP email sent to ${email}`);
};

module.exports = { generateOTP, sendOTPEmail };