// Chapterless-main/app.js
const express = require("express");
const app = express();
const path = require("path");
const env = require("dotenv").config(); // Make sure dotenv is configured
const session = require("express-session");
const connectDB = require("./config/db"); // Your DB connection
const userRouter = require("./routes/userRoutes"); // Or your auth routes file
// const passport = require("./config/passport"); // If using Passport for social login

// Database Connection
connectDB();

// Middlewares
app.use(express.json()); // For parsing application/json
app.use(express.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded

// Session Configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET, // Set a strong secret in your .env
    resave: false,
    saveUninitialized: false, // Set to true if you want to save sessions for unauthenticated users
    cookie: {
      secure: process.env.NODE_ENV === "production", // Use secure cookies in production
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // e.g., 24 hours
    },
  })
);

// Passport (if using for social login, ensure it's configured correctly)
// app.use(passport.initialize());
// app.use(passport.session());

// View Engine Setup (EJS)
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views")); // Standard views directory

// Static Files (CSS, JS, Images)
app.use(express.static(path.join(__dirname, "public")));

// Cache Control Middleware (Global or specific routes)
app.use((req, res, next) => {
  // Example: Apply to all responses, or selectively
  // res.set("Cache-Control", "no-store");
  next();
});

// Routes
app.use("/", userRouter); // Mount your user/auth routes

// Basic Error Handling (Example)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
