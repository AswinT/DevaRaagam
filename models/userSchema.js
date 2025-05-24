// C:\DR\models\userSchema.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: false,
      unique: true,
      sparse: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: function () {
        return !this.googleId;
      },
    },
    googleId: {
      // Field itself is not marked unique or sparse here
      type: String,
    },
    profileImage: {
      type: String,
      required: false,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Add a partial unique index for googleId
userSchema.index(
  { googleId: 1 },
  {
    unique: true,
    // This ensures uniqueness ONLY for documents where googleId is a string (i.e., not null or missing)
    partialFilterExpression: { googleId: { $type: "string" } },
  }
);

// If you also want to ensure that if phone exists, it's unique (allowing multiple nulls)
// The `unique: true, sparse: true` directly on the phone field definition handles this correctly.

module.exports = mongoose.model("User", userSchema);
