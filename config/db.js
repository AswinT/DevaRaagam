// C:\DR\config\db.js
const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      // These are common options, defaults are usually fine for modern Mongoose
      // useNewUrlParser: true, // Deprecated
      // useUnifiedTopology: true, // Deprecated
      // useCreateIndex: true, // Deprecated, Mongoose 6+ handles this automatically
      autoIndex: true, // Explicitly true (default in development)
    });
    console.log("✅ Database connection successful");
  } catch (error) {
    console.log(`❌ Database connection failed: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
