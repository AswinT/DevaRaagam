// C:\DR\controllers\userController\logoutController.js
const logout = async (req, res) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        console.error("Error destroying session:", err);
        return res.status(500).send("Logout failed");
      }

      // Set cache-control headers to prevent back button access
      // after logout
      res.header(
        "Cache-Control",
        "no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0"
      );
      res.header("Pragma", "no-cache");
      res.header("Expires", "0");

      // It's also good practice to clear the cookie explicitly if your session middleware uses one
      // The name 'connect.sid' is common for express-session but can vary.
      res.clearCookie("connect.sid"); // Or whatever your session cookie is named

      res.redirect("/login"); // Redirect to login page after logout
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).send("Internal Server Error");
  }
};

module.exports = { logout };
