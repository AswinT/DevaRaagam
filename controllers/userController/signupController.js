const User = require("../../models/userSchema");
const OTP = require("../../models/otpSchema");
const { hashPassword } = require("../../helpers/hash");
const sendOtpEmail = require("../../helpers/sendMail");

const otpGenerator = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

const getSignupPage = (req, res) => {
  try {
    if (req.session.user_id) {
      return res.redirect("/");
    }
    res.header(
      "Cache-Control",
      "no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0"
    );
    res.header("Pragma", "no-cache");
    res.header("Expires", "0");
    res.render("user/signup");
  } catch (error) {
    console.error("Error rendering signup page:", error.message);
    res.status(500).send("Error loading signup page. Please try again later.");
  }
};

const postSignup = async (req, res) => {
  try {
    const { fullName, email, phoneNumber, password } = req.body;
    console.log("[SignupAttempt] Received data:", {
      fullName,
      email,
      phoneNumber: phoneNumber || "N/A",
    });

    const existingUser = await User.findOne({
      $or: [{ email: email }, { phone: phoneNumber ? phoneNumber : undefined }],
    });

    if (existingUser) {
      console.warn(
        `[SignupAttempt] User already exists: ${email} or phone ${phoneNumber}`
      );
      return res.status(409).json({
        success: false,
        message: "User with this email or phone number already exists!",
      });
    }

    const otp = otpGenerator();
    const subjectContent = "Verify your email for DevaRaagam Headphones";
    console.log(`[SignupAttempt] Generated OTP ${otp} for ${email}`);

    try {
      await sendOtpEmail(email, fullName, otp, subjectContent, "signup");
      console.log(
        `[SignupAttempt] OTP email successfully dispatched to ${email}.`
      );
    } catch (emailError) {
      console.error(
        `[SignupAttempt] Failed to send OTP email to ${email}:`,
        emailError.message
      );
      return res.status(500).json({
        success: false,
        message:
          "Failed to send OTP. Please check the email address and try again. If the problem persists, contact support.",
      });
    }

    console.log("[SignupAttempt] Hashing password...");
    const hashedPassword = await hashPassword(password);
    console.log("[SignupAttempt] Password hashed.");

    console.log(
      `[SignupAttempt] Deleting any existing signup OTPs for ${email}...`
    );
    await OTP.deleteMany({ email: email, purpose: "signup" });
    console.log(`[SignupAttempt] Existing signup OTPs for ${email} deleted.`);

    console.log(
      `[SignupAttempt] Saving new OTP ${otp} for ${email} to database...`
    );
    const otpDoc = new OTP({ email: email, otp, purpose: "signup" });
    await otpDoc.save();
    console.log(`[SignupAttempt] New OTP for ${email} saved to database.`);

    console.log("[SignupAttempt] Storing temporary user data in session...");
    req.session.tempUser = {
      fullName,
      email,
      phone: phoneNumber,
      password: hashedPassword,
    };
    req.session.otpPurpose = "signup";

    await new Promise((resolve, reject) => {
      req.session.save((err) => {
        if (err) {
          console.error(
            "[SignupAttempt] CRITICAL: Session save error after setting tempUser:",
            err
          );
          return reject(new Error("Session save failed"));
        }
        resolve();
      });
    });
    console.log("[SignupAttempt] Session data saved successfully.");

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully. Please verify to complete registration.",
      redirectTo: "/verify-otp",
    });
  } catch (error) {
    console.error(
      "[SignupAttempt] Error in postSignup main try block:",
      error.message,
      error.stack
    );
    let userMessage =
      "An internal server error occurred. Please try again later.";
    if (error.message === "Session save failed") {
      userMessage =
        "There was an issue initiating your signup session. Please try again.";
    } else if (
      error.name === "MongoNetworkError" ||
      error.name === "MongooseServerSelectionError"
    ) {
      userMessage = "Database connection error. Please try again later.";
    }
    return res.status(500).json({
      success: false,
      message: userMessage,
    });
  }
};

const getOtpPage = (req, res) => {
  try {
    const email = req.session.tempUser?.email;
    const purpose = req.session.otpPurpose;
    if (!email || !purpose) {
      console.warn(
        "[OtpPageAttempt] No tempUser email or purpose in session. Redirecting."
      );
      return res.redirect(purpose === "signup" ? "/signup" : "/login");
    }
    res.header(
      "Cache-Control",
      "no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0"
    );
    res.render("user/verify-otp", { email, purpose });
  } catch (error) {
    console.error("Error rendering OTP page:", error.message);
    res.status(500).send("Error loading OTP verification page.");
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { otp } = req.body;
    const tempUser = req.session.tempUser;
    const otpPurpose = req.session.otpPurpose;

    console.log(
      `[VerifyOtpAttempt] Received OTP: ${otp} for purpose: ${otpPurpose}, email: ${tempUser?.email}`
    );

    if (!tempUser || !tempUser.email || !otpPurpose) {
      console.warn("[VerifyOtpAttempt] Session expired or invalid.");
      return res
        .status(400)
        .json({
          success: false,
          message: "Session expired or invalid. Please try the process again.",
        });
    }

    const otpDoc = await OTP.findOne({
      email: tempUser.email,
      purpose: otpPurpose,
      otp: otp,
    });

    if (!otpDoc) {
      console.warn(
        `[VerifyOtpAttempt] Invalid or expired OTP for ${tempUser.email}. Submitted OTP: ${otp}`
      );
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP. Please request a new one.",
      });
    }

    console.log(
      `[VerifyOtpAttempt] OTP verified successfully for ${tempUser.email}.`
    );

    if (otpPurpose === "signup") {
      console.log(`[VerifyOtpAttempt] Creating new user: ${tempUser.email}`);
      const newUser = new User({
        fullName: tempUser.fullName,
        email: tempUser.email,
        phone: tempUser.phone,
        password: tempUser.password,
        isVerified: true,
      });
      await newUser.save(); // <--- POTENTIAL ERROR POINT
      console.log(
        `[VerifyOtpAttempt] New user ${newUser.email} saved. Logging in.`
      );

      req.session.user_id = newUser._id;
      req.session.user_email = newUser.email;

      delete req.session.tempUser;
      delete req.session.otpPurpose;
      await OTP.deleteOne({ _id: otpDoc._id }); // <--- POTENTIAL ERROR POINT

      await new Promise((resolve, reject) => {
        // <--- POTENTIAL ERROR POINT (SESSION SAVE)
        req.session.save((err) => {
          if (err) {
            console.error(
              "[VerifyOtpAttempt] CRITICAL: Session save error after user creation:",
              err
            );
            return reject(new Error("Session save failed after signup"));
          }
          resolve();
        });
      });
      console.log(
        `[VerifyOtpAttempt] Session saved for new user ${newUser.email}.`
      );

      return res.status(200).json({
        success: true,
        message: "Account created and verified successfully! Redirecting...",
        redirectTo: "/",
      });
    } else if (otpPurpose === "forgot-password") {
      console.log(
        `[VerifyOtpAttempt] OTP for password reset verified for ${tempUser.email}.`
      );
      req.session.resetPasswordVerified = true;
      req.session.resetPasswordEmail = tempUser.email;

      delete req.session.tempUser;
      delete req.session.otpPurpose;
      await OTP.deleteOne({ _id: otpDoc._id });
      await new Promise((resolve, reject) => {
        req.session.save((err) => {
          if (err) {
            console.error(
              "[VerifyOtpAttempt] CRITICAL: Session save error for password reset flag:",
              err
            );
            return reject(new Error("Session save failed for password reset"));
          }
          resolve();
        });
      });

      return res.status(200).json({
        success: true,
        message: "OTP verified. You can now reset your password.",
        redirectTo: "/reset-password",
      });
    } else {
      console.error(`[VerifyOtpAttempt] Unknown OTP purpose: ${otpPurpose}`);
      return res
        .status(400)
        .json({ success: false, message: "Invalid OTP purpose." });
    }
  } catch (error) {
    // This is the catch block that sends the "internal server error" for verifyOtp
    console.error(
      "[VerifyOtpAttempt] Error in verifyOtp:",
      error.message,
      error.stack
    );
    let userMessage =
      "An internal server error occurred during OTP verification."; // User sees this
    if (error.message.includes("Session save failed")) {
      userMessage = "A session error occurred. Please try again.";
    } else if (
      error.name === "MongoNetworkError" ||
      error.name === "MongooseServerSelectionError" ||
      error.name === "MongoServerError" ||
      error.name === "MongoWriteConcernError"
    ) {
      userMessage = "A database error occurred. Please try again later.";
    } else if (error.name === "ValidationError") {
      // Mongoose validation error
      userMessage =
        "There was an issue with the data provided. Please check your input.";
      // You might want to extract specific validation messages if needed
      // For example: Object.values(error.errors).map(e => e.message).join(', ')
    }
    return res.status(500).json({
      success: false,
      message: userMessage,
    });
  }
};

const resendOtp = async (req, res) => {
  try {
    const email = req.session.tempUser?.email;
    const otpPurpose = req.session.otpPurpose;
    const fullName = req.session.tempUser?.fullName || "User";

    if (!email || !otpPurpose) {
      console.warn("[ResendOtpAttempt] Session expired or invalid for resend.");
      return res.status(400).json({
        success: false,
        message: "Session expired or invalid. Please start the process again.",
      });
    }

    const otp = otpGenerator();
    const subjectContent =
      otpPurpose === "signup"
        ? "Your new OTP for DevaRaagam Headphones"
        : "Your new Password Reset OTP";

    console.log(
      `[ResendOtpAttempt] Resending OTP ${otp} to ${email} for purpose: ${otpPurpose}`
    );

    await OTP.deleteMany({ email, purpose: otpPurpose });
    const otpDoc = new OTP({ email, otp, purpose: otpPurpose });
    await otpDoc.save();
    console.log(
      `[ResendOtpAttempt] New OTP ${otp} for ${email} (purpose: ${otpPurpose}) saved.`
    );

    await sendOtpEmail(email, fullName, otp, subjectContent, otpPurpose);
    console.log(`[ResendOtpAttempt] New OTP email dispatched to ${email}.`);

    return res.status(200).json({
      success: true,
      message: "New OTP sent to your email.",
    });
  } catch (error) {
    console.error(
      "[ResendOtpAttempt] Error resending OTP:",
      error.message,
      error.stack
    );
    return res.status(500).json({
      success: false,
      message: "Failed to resend OTP. Please try again.",
    });
  }
};

module.exports = {
  getSignupPage,
  postSignup,
  getOtpPage,
  verifyOtp,
  resendOtp,
};
