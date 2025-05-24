const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  otp: {
    type: String,
    required: true,
  },
  purpose: {
    type: String,
    enum: ["signup", "password-reset", "email-update"], // Add more purposes if needed
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Create index on createdAt for TTL (Time To Live)
// OTPs will expire after 5 minutes (300 seconds)
otpSchema.index({ createdAt: 1 }, { expireAfterSeconds: 300 });

module.exports = mongoose.model("OTP", otpSchema);
