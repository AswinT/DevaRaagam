const User = require("../../models/userSchema");
const { comparePassword } = require("../../helpers/hash"); // Use the compare function

const getLoginPage = (req, res) => {
  try {
    // Prevent caching of login page if user is already logged in
    if (req.session.user_id) {
      return res.redirect("/");
    }
    res.header(
      "Cache-Control",
      "no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0"
    );
    res.header("Pragma", "no-cache");
    res.header("Expires", "0");
    res.render("user/login"); // Assuming login.ejs in views/user
  } catch (error) {
    console.error("Error rendering login page:", error);
    res.status(500).send("Error loading page.");
  }
};

const postLogin = async (req, res) => {
  try {
    const { email, password } = req.body; // Already validated by middleware

    const existingUser = await User.findOne({ email: email });

    if (!existingUser) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.", // Generic message for security
      });
    }

    if (existingUser.isBlocked) {
      return res.status(403).json({
        success: false,
        message: "Your account is blocked. Please contact support.",
      });
    }

    if (!existingUser.password) {
      // This case handles users who signed up via OAuth (e.g., Google) and don't have a local password
      return res.status(401).json({
        success: false,
        message:
          "Please log in using the method you originally signed up with (e.g., Google).",
      });
    }

    const isPasswordCorrect = await comparePassword(
      password,
      existingUser.password
    );

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.", // Generic message
      });
    }

    if (!existingUser.isVerified) {
      // Option: Resend OTP if user exists but is not verified
      // For now, just inform them.
      return res.status(403).json({
        success: false,
        message:
          "Your account is not verified. Please check your email for a verification link or sign up again to receive an OTP.",
        // You could add a flag here to indicate frontend to show a "Resend verification" option
        // requiresVerification: true
      });
    }

    req.session.user_id = existingUser._id;
    req.session.user_email = existingUser.email; // Store email in session

    req.session.save((err) => {
      if (err) {
        console.error("Session save error during login:", err);
        return res
          .status(500)
          .json({
            success: false,
            message: "Login failed due to a session error.",
          });
      }
      return res.status(200).json({
        success: true,
        message: "Login successful! Redirecting...",
        redirectTo: "/", // Redirect to home page or dashboard
      });
    });
  } catch (error) {
    console.error("Error in postLogin:", error);
    res.status(500).json({
      success: false,
      message: "An internal server error occurred. Please try again later.",
    });
  }
};

module.exports = { getLoginPage, postLogin };
