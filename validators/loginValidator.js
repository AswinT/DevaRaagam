const loginValidator = (req, res, next) => {
  const { email, password } = req.body;
  const errors = {};

  // Normalize email
  const trimmedEmail = email?.toLowerCase().trim();

  // Email validation
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
    errors.email = "Valid email is required.";
  }

  // Password validation
  if (!password || password.length < 8) {
    // Ensure this matches signup password requirements
    errors.password = "Password must be at least 8 characters.";
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      success: false,
      errors, // Send specific errors
      message: "Validation failed. Please check your input.",
    });
  }

  req.body.email = trimmedEmail; // Use trimmed email for controller

  next();
};

module.exports = { loginValidator };
