// C:\DR\controllers\userController\forgotPasswordController.js
const User = require("../../models/userSchema");
const OTP = require("../../models/otpSchema");
const hashPasswordHelper = require("../../helpers/hash");
const sendOtpEmail = require("../../helpers/sendMail");
// const { session } = require("passport"); // This line seems unused, can be removed

const getForgotPassword = async (req, res) => {
  try {
    res.header(
      "Cache-Control",
      "no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0"
    );
    res.render("user/forgotPassword"); // Make sure you have forgotPassword.ejs
  } catch (error) {
    console.log("Error in getting getForgotPassword", error);
    res.status(500).json({
      success: false,
      message: "Server Error loading page.",
    });
  }
};

const postForgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const trimmedEmail = email?.trim().toLowerCase();

    if (!trimmedEmail) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required." });
    }

    const user = await User.findOne({ email: trimmedEmail });

    if (!user) {
      // It's generally better not to reveal if an email exists for security.
      console.log(
        `Password reset attempt for non-existent email: ${trimmedEmail}`
      );
      return res.status(200).json({
        // Still send 200 to not reveal email existence
        message: "If an account with that email exists, an OTP has been sent.",
        success: true, // From the user's perspective, the action might have been "successful"
        // redirectTo: "/otpForgotPassword" // Or your OTP page for password reset
      });
    }

    const otpGenerator = () =>
      Math.floor(100000 + Math.random() * 900000).toString();
    const otp = otpGenerator();
    console.log("Generated OTP for password reset:", otp);

    await OTP.deleteMany({ email: trimmedEmail, purpose: "password-reset" });

    const otpDoc = new OTP({
      email: trimmedEmail,
      otp,
      purpose: "password-reset", // Specific purpose
    });
    await otpDoc.save();

    const subjectContent = "Your Password Reset OTP for Headphone Store";
    await sendOtpEmail(
      trimmedEmail,
      user.fullName,
      otp,
      subjectContent,
      "forgot-password"
    );

    req.session.tempUser = { email: trimmedEmail }; // Store minimal data needed
    req.session.otpPurpose = "password-reset"; // Store the purpose

    return res.status(200).json({
      message: "OTP sent successfully. Please check your email.",
      success: true,
      redirectTo: "/otpForgotPassword", // Your route for verifying password reset OTP
    });
  } catch (error) {
    console.log("Error in sending OTP for Forgot Password:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error. Please try again.",
    });
  }
};

const resendOtp = async (req, res) => {
  try {
    const email = req.session.tempUser?.email;
    const otpPurpose = req.session.otpPurpose;

    if (!email || otpPurpose !== "password-reset") {
      // Ensure it's for password reset
      return res.status(400).json({
        success: false,
        message:
          "Session expired or invalid. Please start the password reset process again.",
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      // This case should ideally not be hit if postForgotPassword was successful
      return res
        .status(404)
        .json({ success: false, message: "User not found for OTP resend." });
    }

    const otpGenerator = () =>
      Math.floor(100000 + Math.random() * 900000).toString();
    const otp = otpGenerator();
    console.log("Resending password reset OTP:", otp, "to", email);

    await OTP.deleteMany({ email, purpose: "password-reset" });

    const otpDoc = new OTP({ email, otp, purpose: "password-reset" });
    await otpDoc.save();

    const subjectContent = "New OTP for Resetting your Password";
    // Use user.fullName if available, otherwise a generic name
    await sendOtpEmail(
      email,
      user.fullName || "User",
      otp,
      subjectContent,
      "forgot-password"
    );

    return res.status(200).json({
      message: "New OTP sent successfully",
      success: true,
      // expiresIn: 300 // You can inform the frontend about the OTP expiry
    });
  } catch (error) {
    console.log("Error in resending OTP for password reset:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error while resending OTP.",
    });
  }
};

const getOtpForgotPassword = async (req, res) => {
  try {
    const email = req.session.tempUser?.email;
    const purpose = req.session.otpPurpose;

    if (!email || purpose !== "password-reset") {
      return res.redirect("/forgotPassword"); // Or appropriate page
    }
    res.header(
      "Cache-Control",
      "no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0"
    );
    // You might want a specific EJS view for this or adapt verify-otp.ejs
    res.render("user/otpForgotPassword", { email, purpose }); // Example: otpForgotPassword.ejs
  } catch (error) {
    console.log(
      "Error in getting OTP verification page for password reset",
      error
    );
    res.status(500).send("Server Error loading page.");
  }
};

const verifyOtp = async (req, res) => {
  // This is specifically for password reset OTP
  try {
    const { otp } = req.body;
    const tempUserEmail = req.session.tempUser?.email;
    const otpPurpose = req.session.otpPurpose;

    if (!tempUserEmail || otpPurpose !== "password-reset") {
      return res.status(400).json({
        success: false,
        message:
          "Session expired or invalid. Please request a new OTP for password reset.",
      });
    }

    const otpDoc = await OTP.findOne({
      email: tempUserEmail,
      purpose: "password-reset",
      otp: otp,
    });

    if (!otpDoc) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP. Please request a new one.",
      });
    }

    req.session.resetPasswordVerified = true;
    req.session.resetPasswordEmail = tempUserEmail;

    await OTP.deleteOne({ _id: otpDoc._id });
    delete req.session.tempUser;
    delete req.session.otpPurpose;

    return res.status(200).json({
      success: true,
      message: "OTP verification successful. You can now reset your password.",
      redirectTo: "/resetPassword", // Route to the reset password form
    });
  } catch (error) {
    console.log("Error verifying password reset OTP", error);
    return res.status(500).json({
      success: false,
      message: "Server Error during OTP verification.",
    });
  }
};

const getResetPassword = async (req, res) => {
  try {
    if (!req.session.resetPasswordVerified || !req.session.resetPasswordEmail) {
      return res.redirect("/forgot-password");
    }
    res.header(
      "Cache-Control",
      "no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0"
    );
    res.render("user/resetPasswordForm"); // Make sure you have resetPasswordForm.ejs
  } catch (error) {
    console.log("Error rendering reset password form page:", error);
    return res.status(500).send("Server Error loading page.");
  }
};

const patchResetPassword = async (req, res) => {
  try {
    const { newPassword, confirmPassword } = req.body;

    if (!req.session.resetPasswordVerified || !req.session.resetPasswordEmail) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized. Please verify OTP first.",
        redirectTo: "/forgot-password",
      });
    }

    if (!newPassword || !confirmPassword) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Both password fields are required.",
        });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords don't match.",
        field: "confirmPassword",
      });
    }

    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9!@#$%^&*(),.?":{}|<>]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message:
          "New password must be at least 8 characters with uppercase, lowercase, and number/special character.",
        field: "newPassword",
      });
    }

    const email = req.session.resetPasswordEmail;
    const user = await User.findOne({ email });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    const hashedPassword = await hashPasswordHelper.hashPassword(newPassword);

    user.password = hashedPassword;
    await user.save();

    delete req.session.resetPasswordVerified;
    delete req.session.resetPasswordEmail;
    // Optionally destroy the entire session to force re-login
    // req.session.destroy();

    return res.status(200).json({
      success: true,
      message:
        "Password updated successfully. Please log in with your new password.",
      redirectTo: "/login",
    });
  } catch (error) {
    console.log("Error in updating password:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error while updating password.",
    });
  }
};

module.exports = {
  getForgotPassword,
  postForgotPassword,
  getOtpForgotPassword, // This is the name used in your original userRouter
  verifyOtp, // This is the name used in your original userRouter
  getResetPassword,
  patchResetPassword,
  resendOtp, // This is the name used in your original userRouter
};
