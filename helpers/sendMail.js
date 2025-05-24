require("dotenv").config(); // Ensures .env variables are loaded
const nodemailer = require("nodemailer");

const sendOtpEmail = async (email, name, otp, subject, purpose = "signup") => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER, // CORRECT: Use the environment variable name from your .env file
      pass: process.env.EMAIL_PASS, // Your Gmail App Password from .env
    },
  });

  let messageText;
  let storeName = "DevaRaagam Headphones"; // Or your actual store name

  switch (purpose) {
    case "resend":
      messageText = `Hello ${
        name || "User"
      },\n\nHere's your new OTP for ${storeName} account verification: ${otp}\n\nIf you didn't request this, please ignore.\n\nThanks,\nTeam ${storeName}`;
      break;
    case "forgot-password":
      messageText = `Hello ${
        name || "User"
      },\n\nYour OTP to reset your ${storeName} password is: ${otp}.\n\nThis OTP is valid for 5 minutes.\n\nThanks,\nTeam ${storeName}`;
      break;
    case "email-update":
      messageText = `Hello ${
        name || "User"
      },\n\nYour OTP to update your ${storeName} email is: ${otp}.\n\nThanks,\nTeam ${storeName}`;
      break;
    default: // 'signup'
      messageText = `Hello ${
        name || "User"
      },\n\nYour OTP for ${storeName} signup is: ${otp}\n\nThis OTP is valid for 5 minutes.\n\nThanks,\nTeam ${storeName}`;
  }

  const mailOptions = {
    from: `"${storeName}" <${process.env.EMAIL_USER}>`, // Sender address
    to: email,
    subject: subject || `Verify Your Email - ${storeName}`,
    text: messageText,
  };

  try {
    let info = await transporter.sendMail(mailOptions);
    console.log(
      `OTP email sent to ${email} for purpose: ${purpose}. Message ID: ${info.messageId}`
    );
    return info;
  } catch (error) {
    console.error(
      `Error sending OTP email to ${email} for purpose ${purpose}:`,
      error
    );
    throw new Error(
      `Failed to send OTP email. Please check server logs. Original error: ${error.message}`
    );
  }
};

module.exports = sendOtpEmail;
