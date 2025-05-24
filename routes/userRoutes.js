const express = require("express");
const router = express.Router();

const signupController = require("../controllers/userController/signupController");
const loginController = require("../controllers/userController/loginController");
const landingPageController = require("../controllers/userController/landingPageController");
const shopController = require("../controllers/userController/shopController");

const { signupValidator } = require("../validators/signupValidator");
const { loginValidator } = require("../validators/loginValidator");

// Middleware to check if user is already authenticated (for login/signup pages)
const {
  isNotAuthenticated,
  isAuthenticated,
  preventBackButtonCache,
} = require("../middlewares/authMiddleware"); // Assuming you have this

// Landing Page Route
router.get("/", landingPageController.getLandingPage);

// Products Page Route (Shop Page)
router.get("/products", shopController.getShopPage);
// You might also want a "/shop" route if your landing page links to that
router.get("/shop", shopController.getShopPage);

// Signup Routes
router.get(
  "/signup",
  isNotAuthenticated,
  preventBackButtonCache,
  signupController.getSignupPage
);
router.post(
  "/signup",
  isNotAuthenticated,
  signupValidator,
  signupController.postSignup
);

// OTP Routes
router.get(
  "/verify-otp",
  isNotAuthenticated,
  preventBackButtonCache,
  signupController.getOtpPage
);
router.post("/verify-otp", isNotAuthenticated, signupController.verifyOtp);
router.post("/resend-otp", isNotAuthenticated, signupController.resendOtp); // For resending OTP during signup or password reset

// Login Routes
router.get(
  "/login",
  isNotAuthenticated,
  preventBackButtonCache,
  loginController.getLoginPage
);
router.post(
  "/login",
  isNotAuthenticated,
  loginValidator,
  loginController.postLogin
);

// Logout (Example, you'll need a logout controller)
const logoutController = require("../controllers/userController/logoutController"); //
router.get("/logout", isAuthenticated, logoutController.logout); //

// You would also have routes for password reset here
const forgotPasswordController = require("../controllers/userController/forgotPasswordController"); //

router.get(
  "/forgot-password",
  isNotAuthenticated,
  preventBackButtonCache,
  forgotPasswordController.getForgotPassword
); //
router.post(
  "/forgot-password",
  isNotAuthenticated,
  forgotPasswordController.postForgotPassword
); //

// OTP for forgot password (can reuse the getOtpPage or make a specific one)
router.get(
  "/verify-reset-otp",
  isNotAuthenticated,
  preventBackButtonCache,
  forgotPasswordController.getOtpForgotPassword
); //
router.post(
  "/verify-reset-otp",
  isNotAuthenticated,
  forgotPasswordController.verifyOtp
); //
router.post(
  "/resend-reset-otp",
  isNotAuthenticated,
  forgotPasswordController.resendOtp
); //

router.get(
  "/reset-password",
  isNotAuthenticated,
  preventBackButtonCache,
  forgotPasswordController.getResetPassword
); //
router.patch(
  "/reset-password",
  isNotAuthenticated,
  forgotPasswordController.patchResetPassword
); //

module.exports = router;
