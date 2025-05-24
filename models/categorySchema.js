// C:\DevaRaagam\models\categorySchema.js
const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Category name is required."],
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      // required: true, // Description can be optional for some categories
      trim: true,
    },
    image: {
      // URL or path to an image representing the category
      type: String,
      // required: true // Image can be optional
    },
    isListed: {
      // To easily hide/show categories from users
      type: Boolean,
      default: true,
    },
    // You could add a slug for user-friendly URLs
    // slug: {
    //   type: String,
    //   lowercase: true,
    //   unique: true,
    //   index: true
    // }
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

// Optional: Middleware to create a slug from the name before saving
// categorySchema.pre('save', function(next) {
//   if (this.isModified('name') || this.isNew) {
//     this.slug = this.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
//   }
//   next();
// });

module.exports = mongoose.model("Category", categorySchema);
