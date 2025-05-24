// C:\DR\middlewares\authMiddleware.js

/**
 * Middleware to check if user is authenticated
 * Redirects to login if not authenticated
 */
const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.user_id) {
    return next();
  }
  // Store the original URL to redirect back after login, if desired
  // req.session.returnTo = req.originalUrl;
  return res.redirect("/login");
};

/**
 * Middleware to check if user is already logged in
 * Redirects to home if authenticated
 */
const isNotAuthenticated = (req, res, next) => {
  if (req.session && req.session.user_id) {
    return res.redirect("/"); // Redirect to home or dashboard
  }
  return next();
};

/**
 * Middleware to prevent caching for pages that should not be accessible via back button
 * after logout
 */
const preventBackButtonCache = (req, res, next) => {
  res.header(
    "Cache-Control",
    "no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0"
  );
  res.header("Pragma", "no-cache");
  res.header("Expires", "0");
  next();
};

module.exports = {
  isAuthenticated,
  isNotAuthenticated,
  preventBackButtonCache,
};
