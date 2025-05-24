const signupValidator = (req, res, next) => {
  const { fullName, email, phoneNumber, password, confirmPassword } = req.body;
  const errors = {};

  // Normalize inputs
  const trimmedFullName = fullName?.trim();
  const trimmedEmail = email?.toLowerCase().trim();
  const trimmedPhoneNumber = phoneNumber?.trim();

  // Full Name validation
  if (!trimmedFullName || trimmedFullName.length < 3) {
    errors.fullName = "Full name must be at least 3 characters.";
  } else if (!/^[A-Za-z\s'-]+$/.test(trimmedFullName)) {
    errors.fullName = "Name contains invalid characters.";
  } else if (
    trimmedFullName.split(" ").filter((word) => word.length > 0).length < 2
  ) {
    errors.fullName = "Please provide both first and last name.";
  }

  // Email validation
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
    errors.email = "Please enter a valid email address.";
  } else {
    const disposableDomains = ["mailinator.com", "tempmail.com", "yopmail.com"]; // Add more if needed
    const domain = trimmedEmail.split("@")[1];
    if (disposableDomains.includes(domain)) {
      errors.email = "Please use a non-disposable email address.";
    }
  }

  // Phone Number validation (optional, make it required if needed)
  if (trimmedPhoneNumber) {
    const cleanPhone = trimmedPhoneNumber.replace(/\D/g, "");
    if (!/^\d{10}$/.test(cleanPhone)) {
      // Simple 10-digit validation, adjust for international numbers if needed
      errors.phoneNumber = "Phone number must be 10 digits.";
    } else if (
      /^(.)\1+$/.test(cleanPhone) ||
      /^0{10}$/.test(cleanPhone) ||
      /^1{10}$/.test(cleanPhone)
    ) {
      errors.phoneNumber = "Please enter a valid phone number.";
    }
  } else {
    // errors.phoneNumber = "Phone number is required"; // Uncomment if phone is mandatory
  }

  // Password validation
  if (!password) {
    errors.password = "Password is required.";
  } else {
    const minLength = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[@$!%*?&_\-#]/.test(password);

    if (
      !minLength ||
      !hasUppercase ||
      !hasLowercase ||
      !hasNumber ||
      !hasSpecial
    ) {
      let errorMsg =
        "Password must be at least 8 characters and include uppercase, lowercase, number, and special character (@$!%*?&_-#).";
      errors.password = errorMsg;
    } else if (/123456|password|qwerty/i.test(password)) {
      errors.password = "Password is too common.";
    }
  }

  // Confirm Password
  if (password !== confirmPassword) {
    errors.confirmPassword = "Passwords do not match.";
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ success: false, errors });
  }

  // Sanitize and pass to next middleware
  req.body.fullName = trimmedFullName;
  req.body.email = trimmedEmail;
  req.body.phoneNumber = trimmedPhoneNumber;

  next();
};

module.exports = { signupValidator };
